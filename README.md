# Kemet Tabletop III

**[Open the hosted V3 beta on your phone](https://ptravnicek.github.io/kemet-ai-companion/v3/)**

A personal browser companion for the original Matagot Kemet, 2018 printing. The game runs on the device; GitHub Pages delivers its static files. No Replit dependency, cloud VM, account, API key, board upload or card transcription is required.

## First things to try

**Movement:** tap one of your blue armies → choose how many units move and which Move action space to use → Show reachable destinations → tap a destination → inspect the arrow, movement allowance and payment → Confirm move or Cancel. Unavailable destinations explain why they are blocked.

**Pyramids:** tap a pyramid on your player mat → choose a higher level → inspect the cost and action space → Confirm & pay. A level 1-to-3 upgrade costs five prayer before supported discounts; insufficient payment is rejected without changing state.

**AI turn:** request an AI proposal and confirm it. The AI uses the same payment and action validator as the human. Its battle-card decisions are committed before the human chooses cards, with independent hands.

**Practice battle:** Game menu → Practice battle. This does not consume the active game's troops, resources or card inventory.

**Corrections:** Rules beta / coverage → Mirror / setup mode. A persistent warning shows that corrections do not charge costs. Returning to Rules mode checks consistency.

## Scope and testing

Version `3.0.0-beta.1` adds a paid-action rules subset, explicit movement, player mats, built-in artwork, a tap-selectable component catalog, separate battle hands, basic retreat/recall and phase handling, autosave and validated V3 backup/restore. V2 saves remain untouched; [V2 is still available](https://ptravnicek.github.io/kemet-ai-companion/v2/).

This is **not rules-complete Kemet**. DI plays/interruption windows, creatures, special action tokens, replacement battle cards, intermediate troop pickup/drop-off and several power effects require physical/referee resolution. Unsupported power effects are blocked in Rules mode, not silently treated as legal. Artwork is original and stylized, not a reproduction of publisher graphics. AI strategy is a local heuristic.

[Full V3 behavior, limitations and provenance](v3/README.md) · [V3 validation workflow](https://github.com/PTravnicek/kemet-ai-companion/actions/workflows/v3-validation.yml)

The validation workflow runs the retained 14 V2 tests plus 27 V3 core tests, HTTP browser interactions in Chromium and WebKit at phone and desktop sizes, a comparison of actual GitHub Pages files with the committed source, and WebKit interactions against the live HTTPS website. A committed workflow does not itself establish that it passed; inspect its run and evidence artifacts. Automated WebKit testing is not physical-iPhone testing.

## Development

Source: `v3/`; shared dependencies: `v2/core.js`, `v2/art.js`, `v2/style.css`. Keep these V2 dependencies when packaging V3.

- `npm test`: core tests.
- `npm start`: optional development-only static preview, root redirects to `/v3/`.
- `python tests/v3-browser.py`: browser interactions (Playwright installed separately).

No Python game backend is needed for V3. The old `server/`, `battle.html`, `offline.html` and `table.html` prototypes remain for history, not as current user entry points. The superseded README is preserved in [docs/legacy-readme.md](docs/legacy-readme.md).

Unofficial personal fan companion. No Matagot affiliation; no rulebook scans or publisher artwork are redistributed.
