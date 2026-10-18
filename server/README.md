# Backend: battle engine v0.2

This is an **API prototype**, not a fully playable game or a deployed cloud service.

## Run locally

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
pytest -q
```

Open http://localhost:8000/docs to inspect the endpoints.

## HTTP workflow

1. `POST /games` with exactly six **manually transcribed** AI battle card definitions (id, name, strength, damage, protection). Returns `game_id` and a secret bearer `token`. Never publish this token.
2. Use `Authorization: Bearer <token>` for all other game endpoints.
3. `POST /games/{id}/battles` with attacker, 1–5 units on each side, and **confirmed** strength/damage/protection bonuses. This commits the AI's played/discarded choices without revealing them.
4. Human privately commits their own physical played/discarded cards, then `POST /games/{id}/battles/reveal` with their played card. The server reveals the AI's played card and calculates battle results. **The human discard is not tracked yet.**
5. Physically resolve retreat/recall, then `POST /games/{id}/battles/finish`.
6. `GET /games/{id}` returns a public-state projection (requires token). It never includes the unrevealed AI card or its discarded identity.

After all six AI cards have been consumed (three battles), the server refreshes the six-card pool at the next battle.

## Rule coverage and caveats

Implemented based on user's original 2018 manual page 6:
- Strength = units + played card strength + confirmed bonuses; defender wins ties.
- Casualties = opponent damage minus own protection, capped at current units.
- Winning attacker with surviving units earns a permanent battle VP eligibility flag.
- Two distinct cards are consumed per battle; one played, one hidden discard.

Not implemented: divine intervention, power/creature effects as rules (manual bonus inputs only), exact card definitions, human hand exhaustion, recall/retreat, board adjacency, turn phases, scoring ledger, strategy search, user login, or production hosting. **The current AI heuristic is deliberately weak** and selects the highest strength/damage weighted card and discards the lowest.

## Deployment

The `Dockerfile` allows container deployment on a Python-capable host. Set `KEMET_DB` to a path on persistent storage and `ALLOWED_ORIGINS` to the precise frontend HTTPS origin. Without persistent disk, SQLite sessions will disappear on restart.

Do **not** expose this as a production game service yet: bearer token is the sole access secret; there is no rate limiting, user authentication, request-size quota, or operational hardening. Never store OpenAI API keys in GitHub Pages or other public frontend code.

GitHub Pages only serves static files and **cannot run this Python backend**. The existing frontend still uses a browser-only demonstration and has not yet been wired to this API.
