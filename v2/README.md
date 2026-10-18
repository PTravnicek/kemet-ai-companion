# Kemet Tabletop II — version 2.0.0

Open the actual app: https://ptravnicek.github.io/kemet-ai-companion/v2/

No downloadable HTML preview, image upload, account, VM or API key is needed. This is a static browser application. It stores the session on your device, and stays usable in memory when storage is blocked. Reloading offline is not promised; export a backup before clearing browser data.

## Try it in under a minute

Tap **Battle → Quick test**. The AI locks a played card and a separate hidden discard before you choose. Tap your played card, then your discarded card, then **Reveal & resolve**. Finish and repeat. Each player has their OWN six-card hand, recovered after three battles. Reloading resumes a committed battle without changing the AI's choices.

Tap a region on the board to adjust armies or move a troop to another region. Tap prayer/VP counters or pyramids on a player mat to mirror the physical player board. Tap **Powers** to select from the 48 base-game tiles and place them on either mat. DI inventories use a named catalog of 14 base-game types, not free-text entry. AI DI cards stay face down except during explicit editing.

## Implemented versus manual

Implemented: independent battle hands, two-card commitment, defender-wins-ties, damage/protection, capped casualties, attacker VP eligibility, explicit battle modifiers, persistent sessions, undo, validated import/export, troop reserve/size limits, power/DI inventory selection, board mirroring, optional one-time application of bound-battle casualties and battle VP.

Manual: legal movement paths, action choices and costs, power and DI abilities, special replacement battle cards, retreat/recall, creatures returning to reserves, Night effects, temple scoring, turn order and game-end scoring. Tile assignment is an ownership edit, not a paid purchase. DI records mirror ONE physical deck; the app does not shuffle a second deck. The AI is a local battle-card heuristic, not a complete autonomous Kemet opponent. Hidden information is casually concealed, not secure against inspecting browser state.

## Graphics and data provenance

All SVG/CSS board, card and tile graphics are original drawings. No uploaded scan, publisher card artwork or rulebook is redistributed. The board illustrates the west-bank arrangement but is not a verified movement graph or exact reproduction. Use the physical board for legal paths. Card labels such as Cavalry and Assault are descriptive UI labels, not official printed titles. Identify physical cards by their numbers.

The six original base card statistics, in strength / damage / protection order, are **4/1/0, 3/2/0, 3/0/1, 2/2/1, 2/0/2, 1/3/0**. These replace the invented placeholder statistics in the earlier demos. Ta-Seti cards and the two power-granted replacement cards are excluded.

Sources consulted:
- Owner-supplied Matagot original 2018 rulebook, pages 2 and 6–8 (not redistributed): troop/prayer limits, combat, card recycling, battle VP eligibility.
- Original-component photograph in the 2016 review: https://islaythedragon.com/featured/i-like-king-tut-and-i-cannot-lie-a-review-of-kemet/ — visible base battle-card faces.
- Independent original-game implementation, numeric card definitions only: https://github.com/dd00f/Kemet/blob/master/src/main/java/kemet/model/BattleCard.java — six base cards; its expansion and special cards excluded. No source code copied.
- Universal Head reference for original Kemet v3.4: https://www.orderofgamers.com/downloads/Kemet_v3.4.pdf — red/blue/white power tile names, levels, and DI types. Not Blood and Sand. Only catalog facts used; no PDF art copied.

## Testing

`node --test tests/core.test.mjs` runs 14 core tests. `python tests/mobile.py` runs Playwright browser interactions at 390×844 and 1280×900. Set `BROWSERS=chromium,webkit`. Tests cover clicks, board moves, resource/tile edits, page reload, locked choices surviving reload, four consecutive battles, independent hand recovery and blocked storage. CI additionally waits for the exact committed files to appear on GitHub Pages and repeats browser tests against the live HTTPS URL. Screenshots and JSON reports are uploaded as workflow artifacts.

Automated WebKit testing is not a claim of testing on physical iPhone hardware.
