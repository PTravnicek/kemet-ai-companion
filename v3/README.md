# Kemet Tabletop III — 3.0.0-beta.1

This release reuses the completed V3 beta from the saved implementation archive and publishes through the existing GitHub Pages site. It does not use Replit, a cloud VM, a game server, accounts or API keys. The GitHub Actions V3 validation run is the source of truth for deployment and browser-test status; do not infer success merely from this README.

App URL after successful publication: https://ptravnicek.github.io/kemet-ai-companion/v3/

## Try the changed interactions

Tap your blue army in the red city district, select the travelling count and a Move action space, then **Show reachable destinations**. A destination tap displays the arrow route, ordinary movement allowance, prayer cost and battle warning. Confirm executes the action once; Cancel changes nothing. An invalid destination gives a persistent reason.

Tap a pyramid on your player mat to preview an upgrade. Raising level 1 to 3 costs 2 + 3 prayer before supported discounts. Payment and occupied action space are applied together on confirmation. The AI turn button also proposes an action for confirmation using the same validator and payment engine.

Game menu → Practice battle is isolated from the active game's troops, resources and card inventories. The AI commits before human card selection. Each player has a separate six-card hand; the played/discarded pair is tracked independently.

## Implemented beta scope

- Built-in illustrated west-bank board, armies, pyramids, separate player mats, base battle cards and a tap-selectable power catalog. No uploads or card transcription.
- Paid base movement/teleportation, source splitting, friendly troop merging, reserve and troop-size limits, city-wall checks and movement-triggered battles.
- Paid pyramid upgrades, recruitment, prayer and supported power purchases. Alternating turns, five standard tokens, occupied action spaces and three-row coverage.
- Basic bound-battle casualties, surviving-attacker battle VP, explicit retreat/recall, temporary control scoring, basic end-of-Day temple income and Night prayer.
- Nineteen unique numeric/base-rule power effects. Other powers are blocked in Rules mode rather than silently ignored.
- Explicit Mirror/setup mode for corrections, with a persistent costs-not-applied warning. Returning to Rules mode checks consistency.
- Atomic commands, stale-preview rejection, local saves, validated V3 restore, limited undo, and in-memory operation when browser storage is blocked.

## Important limitations

This is not a rules-complete Kemet implementation. DI plays/interruption windows, creatures, special action tokens, replacement battle cards, intermediate troop pickup/drop-off and other unsupported tile effects are not automated. DI records mirror the physical deck; no second deck is shuffled. The AI is a local heuristic, not a strong full-game strategist. Resolve unsupported interactions physically through clearly labelled correction mode.

The beta starts with a convenience 1/1/1 pyramid allocation, ten units in two districts and seven prayer (five setup plus two first-Night prayer). Change your physical setup through Mirror mode. V2 browser saves remain untouched; V3 uses `kemet.tabletop.v3`. Downloading an HTML attachment is not the supported iPhone test path; open the hosted HTTPS app. Native offline reload is not promised.

## Tests and code

`npm test` runs 14 retained V2 regressions and 27 V3 core tests. `tests/v3-browser.py` exercises movement preview/cancel/payment, invalid destinations, AI confirmation, pyramid 1→3 payment, native HTTP reload, practice battle commitment and Mirror-mode warnings at 390×844 and 1280×900. The workflow runs Chromium and WebKit locally on its runner, compares nine published asset hashes to the commit, then repeats WebKit tests against the actual HTTPS site. Browser reports and screenshots are workflow artifacts. Automated WebKit tests are not physical-iPhone tests.

`v3/core.js` and `map.js` provide pure rules and graph data; `app.js` drives taps and confirmation; `art.js` and `style.css` extend the original V2 graphics. Keep `v2/core.js`, `v2/art.js` and `v2/style.css`: V3 imports those shared dependencies. `npm start` is an optional developer static preview server, not a user setup requirement.

## Source provenance

Primary rules source: owner's eight-page `KemetManual.pdf`, original Matagot 2018 printing, especially pages 2–8. Board arrangement reconstructed from the supplied scan and cross-checked against topology facts in https://github.com/dd00f/Kemet/blob/master/old-code/data/TwoPlayerGame.java . No Java source copied. Supplementary original-edition power facts: https://www.orderofgamers.com/downloads/Kemet_v3.4.pdf . These scans and illustrations are not redistributed.

Base card strength/damage/protection: 4/1/0, 3/2/0, 3/0/1, 2/2/1, 2/0/2, 1/3/0. UI names are descriptive labels, not asserted printed titles. See `v2/README.md` for the original card-reference audit. All bundled SVG/CSS artwork is original and stylized, not publisher artwork. Unofficial personal fan companion; no Matagot affiliation.
