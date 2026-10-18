# Kemet V3 — A. Feature specification

**Status:** design for implementation; NOT a claim that V3 has been built or deployed.  
**Edition:** owner's original Matagot Kemet, 2018 printing; two-player game.  
**Baseline inspected:** V2.0.0, commit `8f3537882b8acca5f521c6a6e7ea289d7a9d5901`.  
**Companion document:** [B. Developer implementation plan](v3-implementation-plan.md).

## 1. Product contract

The app is a top-down digital tabletop for a physical Kemet game. The player must be able to see which army is moving, where it can go, what the action costs, and why a proposed action is disallowed. A normal tap must never silently create troops, change a pyramid for free, or transfer ownership of a power tile.

It remains a hosted browser application usable from an iPhone link. No VM, account, API key, board upload, card transcription, or mandatory drag gesture is required. Built-in board and component graphics must ship with the release. Keep the existing local battle opponent; full-game autonomous strategy is a later capability, not a prerequisite for these improvements.

### Source convention

`M1`–`M8` refer to pages of the owner's uploaded eight-page `KemetManual.pdf`. These are the primary rules source. Existing V2 catalog entries are implementation data, not proof that every card effect or value has been verified. Proposed UX and software behavior below are design decisions, not quotations from the rules.

The supplied board scan is the reference for the physical layout. It must not be dismissed as incomplete solely because the V2 illustration differs from it. No additional board upload is part of the user workflow.

Do not mix in Blood and Sand, revised 1.5 rules, expansion cards, or house rules without a separate, explicit rules profile. Where the supplied manual refers to the separate card index, the detailed effect remains unverified until that index or another clearly identified original-edition source has been reviewed.

## 2. Two clearly different operating modes

### Rules mode — the normal playing surface

Every paid action goes through eligibility, action-space, resource, and effect validation. Display whose turn it is, the phase, and the active rules profile. Free-form resource, unit, ownership, and pyramid editing is unavailable here.

Use three distinct outcomes:

| Outcome | Display and behavior |
| --- | --- |
| Legal under verified active rules | Show route/cost/result preview and permit confirmation. |
| Known illegal | Keep state unchanged; explain the reason and how to choose a legal alternative. |
| Not verifiable with the current rule coverage | Say **Rule not implemented/verified**, not **Illegal** or **Legal**. Do not silently execute. Offer an explicit referee-resolution or setup workflow. |

Rules mode is available only after the board topology and the session's required rule data pass the release/setup checks. A catalog name alone is not enough to automate an ability. Manual adjudication must leave a visible event and an accurate coverage status; it must not masquerade as complete automatic enforcement.

### Mirror / setup mode — reconstruction and corrections

This is the deliberate way to match a physical game already in progress or fix a mistake. Show an amber **SETUP / CORRECTION — costs not applied** banner on every relevant screen. Unit placement, pyramid levels, tile ownership, and resources can be corrected here without spending actions.

Require an explicit mode switch, preserve a before-state, and log the correction. Do not call these corrections legal turns. Before returning to Rules mode, validate inventory, simultaneous occupancies, action slots, turn/phase, and effect coverage. Missing information must be resolved rather than guessed. Mode changes and structural corrections are blocked during an unresolved move or battle unless that workflow is explicitly reconciled.

## 3. Main tabletop and graphics

Keep the board central, with the AI player mat above it and the human mat below it. On narrow screens, use a board-first layout with a compact bottom sheet; on wider screens, keep both mats visible. The board remains visible while choosing a destination.

### Board requirements

- Draw stable, individually selectable regions, city district boundaries, the Nile, actual harbor links, temples, and obelisks. Use the correct two/four-player board side and disable the East Bank for two players, as M1 specifies.
- Do not insert a Sanctuary or another region simply because it exists on a different board side. The chosen map profile determines which locations exist.
- Use one region ID for the artwork, legal movement graph, army location, selection panel, and event log. Do not derive adjacency from visual proximity or from V2's decorative curves.
- Include a fit-board view and zoom. Tap targets should aim for at least 44 CSS pixels; offer a region list when adjacent districts are too close at the current zoom.
- Keep army pieces visually distinct from temples and pyramids. Each army has a player color, a persistent unit count, an identifiable base, and an attached-creature badge where applicable.
- Pyramids show color and level on both the map and the player mat. Level 0 is represented in reserve rather than as a physical on-board pyramid, consistent with M2/M4.

### Component requirements

Battle cards are identified by strength/damage/protection symbols and values, not invented official-looking names. Descriptive UI labels may remain, clearly separated from printed identities. Public power tiles appear on the owning player's mat. The human's known hand is visible; AI hidden cards and hidden discards remain face down.

Use original built-in vector artwork unless publication of a particular asset is explicitly authorized. The already supplied scan can guide composition and topology without adding an image-import dependency. Visual fidelity must not come at the expense of legible values or accurate spaces.

## 4. Movement: exact interaction

### 4.1 Select the army, not an ambiguous region

Tap the colored army stack. The app explicitly identifies, for example, **Your army · Red district · 5 units**. A region tap with no selected army opens information, not a move. During a pending battle, army taps resume that battle rather than offering ordinary movement.

The panel offers **Move**, **Inspect**, and applicable ordinary actions. Opponent armies can be inspected; they cannot take a human turn. Mirroring an AI-declared action uses the same validator under the AI's active turn, not a player-switch shortcut.

### 4.2 Select units and the action space

After Move, select how many units travel using large minus/plus buttons or preset quantities. Keep units left behind visible as a ghost preview. Show whether a creature travels with the selected troop; validate its ownership and attachment.

Display eligible Move spaces on the player's action pyramid. When more than one is available, the chosen space is visible before confirmation. Placement must preserve the ability to satisfy the three-row requirement by the end of the five standard action tokens. M4 requires empty action spaces and at least one token in each of the first three levels by the end of those actions.

No token, prayer point, or physical piece is changed yet.

### 4.3 Show reachable destinations and the route

Highlight actual reachable regions, using both color and symbols:

- Solid outline and step number: ordinary movement.
- Crossed-sword marker: entry starts a battle.
- Dashed route with an ankh-cost badge: teleportation.
- Lock symbol with an explanatory tap: unavailable destination.

The source army remains highlighted. A sticky route panel shows the selected troop, the exact action slot, ordinary movement used/available, prayer cost, and remaining prayer points. Distinguish **movement allowance** from **number of action tokens**.

Base movement is one space. Ground movement goes to an adjacent space; harbor crossing follows the board's linked harbors and counts as one space; teleportation from a pyramid to an obelisk costs two prayer points and consumes no ordinary movement capacity. Movement types can be combined within resources and allowance. These are M5 rules, not optional UI shortcuts.

A friendly troop is not inherently an obstacle. Permit joining, leaving units, and gathering units while enforcing the applicable troop limit at the relevant points. The base limit is five per space (M2/M5); a power-based exception requires a verified effect definition.

Enemy city entry needs the city-wall check from M6: the troop must begin its movement adjacent to the city's wall. Do not treat an intermediate adjacent step as a new movement start. The owner's own city walls do not constrain that owner. Any exception requires its verified rule.

### 4.4 Preview before committing

Tap a destination. Display the route, intermediate spaces, travel mode on each leg, pieces left/collected, arrival count, and battle warning.

Illustrative route receipt, conditional on the verified map and current effects:

> Red district → Riverside temple  
> Teleport · ordinary movement 0/1 · prayer 2  
> Prayer: 5 → 3 · one Move space will be occupied  
> Enemy present: battle begins on arrival

Buttons: **Confirm move** and **Cancel**. Merely tapping a destination never moves units. Canceling a preview costs nothing. A second tap on Confirm must not execute the action twice.

### 4.5 Show execution and preserve unfinished actions

Animate the army along the committed route; the animation is only a display of the authoritative result. Offer reduced motion without hiding the route. Deduct the Move action once and charge only the executed teleport legs.

Reaching an enemy troop stops ordinary movement and opens the battle workflow (M6). Do not animate through enemies. The Escape clarification in M6 cancels that battle and may allow the move to continue; model it as an interruption of the same action, not a fresh free action or a second paid action.

If a move has already executed a prefix and then reveals new information, Cancel must not silently reverse the committed prefix. Finish, resolve the interruption, or use an explicit correction that acknowledges the revealed information. Reloading must restore the same pending action.

### 4.6 Explain invalid choices

Use persistent messages near the route, not only a disappearing toast. Examples:

- **Not reachable:** this route needs 2 ordinary steps; this troop has 1.
- **Not enough prayer:** teleportation costs 2; you have 1.
- **Troop limit exceeded:** arrival would leave 6 units; the current limit is 5.
- **City wall:** this move did not begin adjacent to that enemy city.
- **Move action unavailable:** both applicable Move spaces are occupied.
- **Row requirement:** this placement would leave too few standard tokens to cover the remaining rows.
- **Rule unverified:** the active movement power is not implemented, so this route cannot be certified.

## 5. Pyramid upgrades: no free rotation in normal play

Tapping a pyramid opens its action sheet. It does not immediately change its level. Show the current level, selectable target levels, cost breakdown, available Raise a Pyramid space, and prayer before/after.

M4 allows one pyramid to gain multiple levels in one action. The base cost is the sum of the levels reached:

| Upgrade | Base prayer cost |
| --- | --- |
| 0 → 1 | 1 |
| 1 → 2 | 2 |
| 1 → 3 | 2 + 3 = 5 |
| 2 → 4 | 3 + 4 = 7 |
| 3 → 4 | 4 |

For **red 1 → 3 with 7 prayer**, show **Pay 5 · prayer 7 → 2 · spend one Raise a Pyramid action**. Confirmation applies payment, level, token, and any resulting control/VP changes together. Insufficient prayer blocks the action with no partial mutation. Preview cancellation leaves everything unchanged. Lowering a pyramid belongs to a correction or a verified effect, not a normal upgrade.

Do not use one generic discount formula for all powers. For example, the M8 Priest of Ra FAQ limits that power's pyramid discount to one prayer point for the entire action, not one per level. Free Night upgrades such as the Hand of God example in M3 belong to their own effect phase and do not consume an ordinary action by accident.

The manual's described benefits of controlling an enemy pyramid do not by themselves settle every upgrade-target question. Add an explicit source check before allowing upgrades of occupied enemy pyramids.

## 6. Recruitment, power tiles, prayer, and creature handling

### Recruitment

Tap Recruit on an eligible action space, then distribute units across eligible own-city districts. Preview one total cost, reserve before/after, and each resulting troop size. Base cost is one prayer per recruited unit; the player has 12 units in total. Recruitment can use one, two, or three own-city districts (M2/M5).

A player controlling someone else's district cannot recruit there. The original city's owner may recruit normally, and recruitment into its occupied district triggers an attack (M5). Such a placement must open combat rather than leave permanent mixed occupancy. If several battles could arise, the resolution sequence requires an explicit supported rule/decision workflow.

### Buying a power tile

Tap the actual catalog tile, inspect its effect, then **Buy**, not **Assign**. Check supply ownership, same-color pyramid access at sufficient level, the matching buy action, prayer, and duplicate-power restrictions. Base cost equals tile level (M4). Reject an already owned tile and reject duplicate equivalent powers even if they have different colors (M5).

Recognize controlled enemy pyramid benefits where the rule permits (M4/M5). Show every applied discount and its source. Apply immediate effects once; schedule Night/battle effects in their proper windows. A catalog entry with an unverified ability may be mirrored, but must not pretend to be an automatically supported purchase.

### Pray

An eligible Pray action adds two prayer points immediately, subject to the maximum of 11 and verified effects (M2/M4). At the cap, explain any wasted income; do not invent a general prohibition on a legal low-value action.

### Creatures

Show actual owned creatures instead of a generic yes/no dragon. One creature per space, not counted as a unit; creature benefits apply to the accompanying troop (M7). Prevent duplicate creature placement. Handle lost accompanying units, return to the city/reserve, and recruitment-based return using M7/M8 rather than deleting or silently merging creatures.

## 7. Turn, action, battle, and scoring presentation

Show the actual action pyramid with occupied spaces, not only an integer saying how many actions remain. Track standard tokens separately from power-granted special tokens. M8 describes special-token behavior; do not force those powers into a five-total-actions-only data model.

Expose Night and Day explicitly. End-of-Day distributions, choices, and win checks precede the next Night. Night then handles base prayer, DI draws in turn order, Night powers, and turn-order determination (M3/M8). Initial setup and the first phase boundary must have a reviewed test fixture; do not silently apply preparation twice.

Separate permanent VP events from temporary control points. Temple control and level-4 pyramid control must not become irreversible manual increments. Victory for this rules profile is checked at the end of Day at the selected 8- or 10-point threshold; use M8's printed tie-break order, not another edition's timing.

A real battle opens from legal enemy entry or a supported effect. A separate **Practice battle** remains available but never changes the game board, prayer, action usage, or VP. Preserve V2's separate hands and AI commitment before human selection. Ordinary battle calculations are M6; retreat, recall, and exceptional survivors are M7. Do not end combat while both players' armies are left in an ordinary peaceful region.

Mirror one physical DI deck unless the user explicitly chooses an all-digital deck workflow. Do not randomly deal from an independent digital deck while also retaining physical draws. AI decisions must not use the human's concealed cards just because the app stores them for bookkeeping.

## 8. User acceptance criteria

V3 is ready for the requested movement/economy test only when:

1. A hosted phone link opens the new build with built-in graphics; no download/upload setup is required.
2. Selecting an army exposes its owner, source, unit count, and available movement actions.
3. Every highlighted legal destination has a validated route on the selected map.
4. Selecting a destination previews its route and full cost without changing state.
5. Confirm moves and pays once; Cancel pays nothing.
6. Enemy entry stops and opens battle; friendly merges respect the troop limit.
7. Pyramid taps open a paid-action dialog; 1 → 3 charges 5 before discounts.
8. Recruitment and tile purchases cannot bypass action or prayer requirements.
9. Unsupported effects are visibly unresolved, never silently treated as legal or absent.
10. Setup/correction remains usable, explicit, reversible before hidden information, and logged.
11. Reloading preserves turns, action slots, hands, and interrupted actions; blocked storage does not disable controls.
12. Browser tests cover actual touch/click workflows and the deployed HTTPS build, not only JavaScript parsing.

## 9. Current V2 facts motivating this specification

These findings concern the inspected commit, not uninspected future code:

- `v2/core.js::moveUnits` checks troop counts but not adjacency, action slots, movement range, prayer, or city walls.
- `v2/app.js` destination handling immediately calls that mirroring function; there is no route confirmation.
- The `pyramid` handler directly clamps and writes a level without payment or action validation.
- Resource counters and tile assignment are explicit editor operations; they must not remain normal-play controls.
- V2 stores one remaining-action count rather than occupied pyramid action spaces, and its board is not a verified movement graph.

Inspected sources: [core.js](../v2/core.js), [app.js](../v2/app.js), and [V2 provenance and limitations](../v2/README.md). See the paired implementation plan for exact replacements, test cases, and release gates.
