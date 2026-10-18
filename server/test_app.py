import os
import tempfile

import pytest
from fastapi.testclient import TestClient

import app as backend


@pytest.fixture
def client():
    with tempfile.TemporaryDirectory() as tmp:
        backend.DB = os.path.join(tmp, "test.db")
        yield TestClient(backend.app)


def cards():
    return [
        {"id": f"c{i}", "name": f"Card {i}", "strength": i, "damage": i % 3, "protection": (i + 1) % 3}
        for i in range(6)
    ]


def game(client):
    response = client.post("/games", json={"ai_cards": cards()})
    assert response.status_code == 201
    payload = response.json()
    return payload["game_id"], {"Authorization": "Bearer " + payload["token"]}


def test_battle_commitment_keeps_both_ai_choices_hidden(client):
    gid, headers = game(client)
    response = client.post(f"/games/{gid}/battles", headers=headers, json={"attacker": "ai", "ai_units": 4, "human_units": 3})
    assert response.status_code == 200
    state = response.json()
    assert state["battle"]["status"] == "committed"
    assert len(state["battle"]["ai_commitment"]) == 64
    assert "played" not in str(state)
    assert "discarded" not in str(state)
    assert "ai_played_card" not in str(state)
    assert client.get(f"/games/{gid}").status_code == 401


def test_reveal_then_finish_and_exhaustion(client):
    gid, headers = game(client)
    for expected in (4, 2, 0):
        r = client.post(f"/games/{gid}/battles", headers=headers, json={"attacker": "human", "ai_units": 3, "human_units": 3})
        assert r.status_code == 200
        r = client.post(f"/games/{gid}/battles/reveal", headers=headers, json={"card": {"id": "human1", "name": "Human card", "strength": 2, "damage": 1, "protection": 1}})
        assert r.status_code == 200
        assert r.json()["ai_available_count"] == expected
        assert r.json()["battle"]["result"]["winner"] in ("ai", "human")
        assert client.post(f"/games/{gid}/battles/finish", headers=headers).status_code == 200
    assert client.post(f"/games/{gid}/battles", headers=headers, json={"attacker": "ai", "ai_units": 3, "human_units": 3}).json()["ai_available_count"] == 6


def test_defender_wins_ties_and_casualties_are_capped():
    battle = {
        "attacker": "human", "ai_units": 3, "human_units": 3,
        "played": {"id": "a", "name": "A", "strength": 2, "damage": 20, "protection": 0},
        "ai_bonuses": {"strength": 0, "damage": 0, "protection": 0},
        "human_bonuses": {"strength": 0, "damage": 0, "protection": 0},
    }
    result = backend.resolve(battle, {"id": "h", "name": "H", "strength": 2, "damage": 1, "protection": 0})
    assert result["winner"] == "ai"
    assert result["casualties"]["human"] == 3
    assert result["attacker_gains_battle_vp"] is False


def test_reject_invalid_inputs(client):
    gid, headers = game(client)
    r = client.post(f"/games/{gid}/battles", headers=headers, json={"attacker": "ai", "ai_units": 6, "human_units": 3})
    assert r.status_code == 422
    r = client.post(f"/games/{gid}/battles/reveal", headers=headers, json={"card": cards()[0]})
    assert r.status_code == 409
