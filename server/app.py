"""Kemet 2018 companion: server-authoritative hidden AI hand and deterministic combat core.

The eight-page user-supplied manual defines combat (p6) but does not include the
six card faces or all DI/power modifiers. Card stats must be entered from owned
cards; external bonuses must be explicitly supplied and confirmed.
"""
import hashlib
import json
import os
import secrets
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

app = FastAPI(title="Kemet AI Companion", version="0.2.0")
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
DB = os.getenv("KEMET_DB", "kemet.db")
_lock = threading.RLock()


@contextmanager
def connection():
    with _lock:
        db = sqlite3.connect(DB, timeout=20)
        db.row_factory = sqlite3.Row
        try:
            db.execute("CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, state TEXT NOT NULL)")
            db.commit()
            yield db
            db.commit()
        finally:
            db.close()


class Card(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    strength: int = Field(ge=0, le=20)
    damage: int = Field(ge=0, le=20)
    protection: int = Field(ge=0, le=20)


class CreateGame(BaseModel):
    ai_cards: list[Card] = Field(min_length=6, max_length=6)

    @model_validator(mode="after")
    def unique_ids(self):
        if len({c.id for c in self.ai_cards}) != 6:
            raise ValueError("All six card IDs must be unique")
        return self


class Bonuses(BaseModel):
    strength: int = Field(default=0, ge=0, le=50)
    damage: int = Field(default=0, ge=0, le=50)
    protection: int = Field(default=0, ge=0, le=50)


class StartBattle(BaseModel):
    attacker: Literal["ai", "human"]
    ai_units: int = Field(ge=1, le=5)
    human_units: int = Field(ge=1, le=5)
    ai_bonuses: Bonuses = Field(default_factory=Bonuses)
    human_bonuses: Bonuses = Field(default_factory=Bonuses)


class HumanReveal(BaseModel):
    # Human played card is entered only after AI commitment.
    card: Card


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def load(game_id: str, authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Game bearer token required")
    with connection() as db:
        row = db.execute("SELECT * FROM games WHERE id=?", (game_id,)).fetchone()
    if not row or not secrets.compare_digest(row["token_hash"], token_digest(authorization[7:])):
        raise HTTPException(404, "Game not found")
    return json.loads(row["state"])


def save(game_id: str, state: dict):
    with connection() as db:
        db.execute("UPDATE games SET state=? WHERE id=?", (json.dumps(state), game_id))


def public(state: dict):
    b = state.get("battle")
    result = {
        "game_id": state["id"],
        "phase": "battle" if b else "idle",
        "ai_available_count": len(state["available"]),
        "ai_exhausted_count": len(state["exhausted"]),
        "battle": None,
    }
    if b:
        result["battle"] = {
            "status": b["status"],
            "attacker": b["attacker"],
            "ai_units": b["ai_units"],
            "human_units": b["human_units"],
            "ai_committed": True,
            "ai_commitment": b["commitment"],
            "human_committed": b["status"] == "revealed",
        }
        if b["status"] == "revealed":
            result["battle"]["result"] = b["result"]
            result["battle"]["ai_played_card"] = b["played"]
    return result


def choose_cards(cards: list[dict]):
    # Baseline heuristic, NOT a trained or strong Kemet AI.
    ordered = sorted(cards, key=lambda c: (c["strength"] * 2 + c["damage"] - c["protection"] * 0.2, c["id"]))
    return ordered[-1], ordered[0]


def resolve(b: dict, human: dict):
    ai = b["played"]
    bonuses_ai = b["ai_bonuses"]
    bonuses_human = b["human_bonuses"]
    strength_ai = b["ai_units"] + ai["strength"] + bonuses_ai["strength"]
    strength_human = b["human_units"] + human["strength"] + bonuses_human["strength"]
    winner = ("ai" if strength_ai > strength_human else "human") if b["attacker"] == "ai" else ("human" if strength_human > strength_ai else "ai")
    # Defender wins ties.
    if strength_ai == strength_human:
        winner = "human" if b["attacker"] == "ai" else "ai"
    lost_ai = max(0, human["damage"] + bonuses_human["damage"] - ai["protection"] - bonuses_ai["protection"])
    lost_human = max(0, ai["damage"] + bonuses_ai["damage"] - human["protection"] - bonuses_human["protection"])
    survivors_ai = max(0, b["ai_units"] - lost_ai)
    survivors_human = max(0, b["human_units"] - lost_human)
    return {
        "winner": winner,
        "battle_value": {"ai": strength_ai, "human": strength_human},
        "casualties": {"ai": min(b["ai_units"], lost_ai), "human": min(b["human_units"], lost_human)},
        "survivors": {"ai": survivors_ai, "human": survivors_human},
        "attacker_gains_battle_vp": winner == b["attacker"] and (survivors_ai if b["attacker"] == "ai" else survivors_human) > 0,
        "human_played_card": human,
        "note": "Resolve retreat/recall, creature and DI effects, and physical-board changes separately. Enter all applicable bonuses before committing.",
    }


@app.get("/health")
def health():
    return {"ok": True, "version": "0.2.0"}


@app.post("/games", status_code=201)
def create_game(body: CreateGame):
    game_id = str(uuid.uuid4())
    token = secrets.token_urlsafe(32)
    state = {"id": game_id, "cards": [c.model_dump() for c in body.ai_cards], "available": [c.id for c in body.ai_cards], "exhausted": [], "battle": None}
    with connection() as db:
        db.execute("INSERT INTO games VALUES (?,?,?)", (game_id, token_digest(token), json.dumps(state)))
    return {"game_id": game_id, "token": token, "state": public(state)}


@app.get("/games/{game_id}")
def get_game(game_id: str, authorization: str | None = Header(default=None)):
    return public(load(game_id, authorization))


@app.post("/games/{game_id}/battles")
def start_battle(game_id: str, body: StartBattle, authorization: str | None = Header(default=None)):
    with _lock:
        state = load(game_id, authorization)
        if state["battle"] and state["battle"]["status"] == "committed":
            raise HTTPException(409, "Resolve the current battle first")
        if state["battle"] and state["battle"]["status"] == "revealed":
            raise HTTPException(409, "Finish the previous battle first")
        if len(state["available"]) < 2:
            if len(state["exhausted"]) != 6:
                raise HTTPException(409, "Invalid card exhaustion state")
            state["available"] = [c["id"] for c in state["cards"]]
            state["exhausted"] = []
        available = [c for c in state["cards"] if c["id"] in state["available"]]
        played, discarded = choose_cards(available)
        nonce = secrets.token_hex(32)
        payload = json.dumps({"played": played["id"], "discarded": discarded["id"], "nonce": nonce}, sort_keys=True)
        commitment = hashlib.sha256(payload.encode()).hexdigest()
        state["battle"] = {
            "status": "committed", "attacker": body.attacker, "ai_units": body.ai_units,
            "human_units": body.human_units, "ai_bonuses": body.ai_bonuses.model_dump(),
            "human_bonuses": body.human_bonuses.model_dump(), "played": played,
            "discarded": discarded["id"], "nonce": nonce, "commitment": commitment,
        }
        save(game_id, state)
        return public(state)


@app.post("/games/{game_id}/battles/reveal")
def reveal_battle(game_id: str, body: HumanReveal, authorization: str | None = Header(default=None)):
    with _lock:
        state = load(game_id, authorization)
        b = state["battle"]
        if not b or b["status"] != "committed":
            raise HTTPException(409, "No committed battle")
        b["result"] = resolve(b, body.card.model_dump())
        b["status"] = "revealed"
        state["available"].remove(b["played"]["id"])
        state["available"].remove(b["discarded"])
        state["exhausted"].extend([b["played"]["id"], b["discarded"]])
        save(game_id, state)
        return public(state)


@app.post("/games/{game_id}/battles/finish")
def finish_battle(game_id: str, authorization: str | None = Header(default=None)):
    with _lock:
        state = load(game_id, authorization)
        if not state["battle"] or state["battle"]["status"] != "revealed":
            raise HTTPException(409, "Reveal the battle first")
        state["battle"] = None
        save(game_id, state)
        return public(state)
