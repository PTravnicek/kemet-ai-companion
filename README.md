# Kemet AI Companion

Mobile-first, unofficial companion for the **original Matagot Kemet (2018 printing)**. Designed for one human player controlling a physical tabletop board against a future digital AI opponent.

## Current status

**v0.1 — Interactive browser prototype only.** The current `index.html` is a standalone mobile-friendly page with:

- AI player dashboard with manual prayer, victory, and action tracking.
- Manual action log and board-state notes.
- Phone camera/photo input for reference (not machine recognition).
- Illustrative six-slot battle card selection, private commitment and reveal UI.
- Local browser storage and JSON session export.

**Important:** The battle card slots are placeholders, not official card definitions. No AI strategist, rules enforcement, server-side secrecy, authentication, or persistent cloud backend exists yet. Do not treat the hidden hand as secure against inspection. The UI is a test harness, not a playable rules-complete opponent.

## Open on an iPhone

Once GitHub Pages is enabled, the public static prototype will be accessible at:

https://ptravnicek.github.io/kemet-ai-companion/

To enable Pages in the repository: Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save. This is a **public demo**. No API keys or private game information should be put in the frontend.

## Rules reference

The user supplied an eight-page photographed manual for the original 2018 Matagot printing. Key confirmed rules:

- Two-player board configuration excludes the East Bank.
- Each player has five action tokens per day.
- Each player has six battle cards. At battle start each side chooses two cards, one discarded and one played; the played card is revealed and the discard may remain hidden.
- Night and Day phases alternate; win condition checked at end of Day.
- Rules and power/DI card index still require formal transcription, review, and tests.

## Planned architecture

- React/TypeScript mobile-first PWA.
- Python FastAPI authoritative server and SQLite persistence.
- Server-side private card hands and irreversible battle commitments, with public reveal only after both sides commit.
- Deterministic legal-action and battle resolver; AI only selects among validated legal actions.
- Camera-assisted board state estimation with explicit human correction.
- Automated tests based on scanned rules and card index.

## Development priorities

1. Transcribe/validate complete rules and card index.
2. Implement server-side game state and public/private projections.
3. Implement combat commitment and resolution with tests.
4. Implement complete turn actions and AI decision API.
5. Add camera calibration and board-diff confirmation.

## Legal

Unofficial fan project. No Matagot artwork or scanned rulebook is redistributed in this repository.

## New: live API Battle Room (v0.3 frontend)

Open [battle.html](./battle.html) on mobile (or, once GitHub Pages is enabled, [the Battle Room](https://ptravnicek.github.io/kemet-ai-companion/battle.html)). It is a client for the separate FastAPI backend, **not** a self-contained game.

To play a server-backed battle:

1. Deploy `server/` to an HTTPS Python/container host with persistent storage and configure `ALLOWED_ORIGINS=https://ptravnicek.github.io`.
2. Enter the backend HTTPS URL in the Battle Room.
3. Transcribe all six original battle card names and strength/damage/protection stats from your physical set. Card data is not bundled.
4. Create a session, enter combatants and manually verified bonuses, then commit the AI's two cards.
5. Commit your physical played and discarded cards, enter your played card's stats, and reveal the result.

GitHub Pages is static hosting; it cannot execute the backend. Until a backend is deployed, the Battle Room is a functional interface but not an end-to-end playable experience.

**Security and accuracy:** This is still an experimental single-player prototype, with no account system or rate limiting. The game bearer token is stored in the phone's local storage; anyone with that token can access and advance the session. AI hidden cards stay in server storage and are not sent before reveal, but a database operator can see them. The SHA-256 commitment is not yet independently verifiable because the discard and nonce are not disclosed. The battle engine does not yet handle all Kemet rules, and AI card choice uses a deterministic heuristic rather than an LLM.

Backend tests are defined in [server/test_app.py](./server/test_app.py) and run via [GitHub Actions](./.github/workflows/backend-tests.yml). A workflow definition is not proof that tests have passed.
