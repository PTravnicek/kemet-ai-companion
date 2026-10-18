# Kemet V3 — B. Developer implementation plan

**Status:** implementation-ready design; no V3 gameplay code is delivered by this document.  
**Product contract:** [A. Feature specification](v3-feature-specification.md).  
**Inspected baseline:** `8f3537882b8acca5f521c6a6e7ea289d7a9d5901`, V2.0.0.  
**Rules authority:** owner's original 2018 manual, pages M1–M8 as defined in document A. Do not silently substitute another edition.

## 1. Architectural decision

Keep the current static-browser deployment and JavaScript module approach. This work does not need a VM, LLM API, account service, or a new frontend framework. The important change is separating state editing from rule-governed actions.

Use this flow for every gameplay action:

`UI intent → pure preview/validation → route/cost receipt → confirmation → revalidation → atomic state transition → render`

The UI must not calculate an independent version of movement legality or cost. AI decisions must submit the same command types as human decisions. No AI-only back door may change pieces, buy powers, or grant resources.

### Keep, refactor, replace

| V2 area | V3 action |
| --- | --- |
| `app.js::change` copies, validates, persists | Retain the atomic-copy principle; wrap it in a revisioned command processor. |
| `core.js::moveUnits` | Rename/restrict to a setup helper; never call it as a normal Move action. |
| `app.js` destination tap | Produce a movement preview, not an immediate mutation. |
| `app.js` pyramid increment/decrement | Replace normal-play path with `RaisePyramid`; retain raw setter only in setup. |
| `assignTile` | Keep only for explicit mirroring; add a separate paid `BuyPower`. |
| `setUnits` and resource steppers | Restrict to setup; introduce paid recruitment and explicit game effects. |
| `resolve`, separate hands, battle commitment | Retain tested core formulas; add effect windows and complete aftermath before treating board combat as finished. |
| `ZONES` and decorative board paths | Replace as rules data with an audited graph and matching polygons; old coordinates remain migration hints only. |
| `art.js`, mats, accessible controls | Reuse what is legible; improve route overlays and component clarity rather than rewriting a form-heavy dashboard. |
| `tests/core.test.mjs`, `tests/mobile.py`, `tests/wait-pages.py` | Preserve V2 regression coverage and add V3-specific rules and deployed-browser tests. |

## 2. Suggested module boundaries

```text
v3/
  index.html
  app.js                    # bootstrap, event delegation, screen state
  style.css
  art/board.svg             # built-in board, no runtime upload
  data/map-original-2p.js    # regions, borders, harbors, obelisks, provenance
  data/action-board.js      # exact spaces and rows from the player board
  data/components.js        # stable card/tile/creature identities
  data/rules-profile.js     # original edition settings and source references
  engine/state.js           # canonical state, invariant validation
  engine/commands.js        # preview/execute dispatch, revision and command IDs
  engine/movement.js        # route generation and replay validator
  engine/actions.js         # pray, recruit, pyramid, power purchase
  engine/effects.js         # typed, source-backed hooks and timing
  engine/battle.js          # commitments, reveal, casualties, aftermath
  engine/phases.js          # setup, Day, end-Day, Night, turn order
  engine/scoring.js         # permanent ledger + derived temporary VP
  engine/observation.js     # information each player is entitled to see
  ui/tabletop.js            # board and mats
  ui/move-overlay.js        # origin, route, destinations, cost receipt
  ui/action-sheet.js        # confirmation and explanations
  storage.js                # save, validated restore, migration, memory fallback
  ai.js                     # existing local heuristic through observation/commands
```

These filenames are proposed boundaries, not existing files. Avoid forcing one file per trivial function; preserve the separation of deterministic rules, UI, and persistence.

## 3. State model: what must be added

Use a schema version and a monotonic revision. Persist the rules profile and map version with the game. Suggested structure:

```text
GameState
  schemaVersion, revision, rulesProfileId, mapVersion
  mode: rules | mirror
  coverage: verified | needsReview | manualAdjudication
  phase, day, turnOrder, currentPlayer, actionOwner
  players[human | ai]
    prayer
    permanentVpLedger[]
    pyramids[color] {level, districtId}
    standardTokens[]
    specialTokens[]
    occupiedActionSlots[]
    battleHand[], battleUsed[]
    divineHand[]
  regions[id]
    troops[player] {units, creatureId?}
  reserve[player]
    creatureIds[]
  powerOwner[tileInstanceId]
  activeMove?, activeBattle?, pendingResolution?
  commandReceipts[], events[], correctionCheckpoints[]
```

Unit reserves can be derived from 12 minus deployed units; do not maintain a second independently mutable troop total. Creature ownership and location are separate from ordinary unit inventory. A creature cannot exist in two places or disappear when two troops merge.

Temporary VP is derived from current, rule-verified control, not edited as the same integer as permanent VP. Each earned permanent VP event has a reason and source action ID, preventing double awards on reload or repeated confirmation.

`actionsRemaining: 3` is insufficient. Store which concrete action slots are occupied and which standard/special tokens were used. Model the ordinary end-of-five-token row requirement separately from power-granted additional actions.

### Pending move

Persist its owner, original region, original city-wall eligibility, chosen action slot/token, initial troop and creature selection, route draft, committed prefix, unit pickups/drop-offs, ground allowance, prayer spent, and interruption cursor. A saved game may be between legs of one action; reloading must not grant a new allowance or spend the action twice.

### Pending battle

Persist origin action, target region, actual attacking and defending troop snapshots, relevant public modifiers, private commitments, hidden DI selections where supported, reveal state, outcome, and aftermath choices. Store whether each state-changing outcome has been applied. A practice battle uses isolated copies and is never bound to the real scoring/action ledger.

## 4. Verified map and component data are release prerequisites

V2's map explicitly says its paths are not a movement graph. Do not infer legality by connecting the nearest V2 coordinates.

For each region, record a stable ID, display name, SVG polygon/hit area, district/city identity if any, temple identity and income if applicable, obelisk presence, and whether it is enabled on the chosen two-player board. For each link, record endpoints, mode (`ground` or `harbor`), directionality if relevant, and source evidence.

Teleport destinations are generated from the current origin pyramid and enabled obelisks; they are not a set of fake ordinary adjacency edges. Occupation can change access to pyramid benefits without changing the underlying map.

For every border and harbor link, create a review row with its scan location and expected rule behavior. Review the entire supplied board scan against M1/M5. Validate district connections, river separation, active cities, excluded East Bank, and absence/presence of the Sanctuary for this board side. No uploaded-image workflow is added to the app.

Each component definition must include:

```text
id, physicalInstanceId, kind, color?, level?, displayLabel,
identity/equivalenceFamily, printedFacts, effectDefinitions,
source {document, page/section, verificationStatus}, supportStatus
```

Two Charge tiles may be separate physical instances but equivalent powers for duplicate restrictions. Do not use tile names as the sole rules identifier. Existing V2 name/level arrays can seed the catalog; they are not verified effect definitions. The original game's special power-granted battle cards need separate identities; do not accidentally substitute Ta-Seti or Blood and Sand cards.

## 5. Command contract and atomicity

Separate gameplay commands (`Move`, `RaisePyramid`, `Recruit`, `BuyPower`, `Pray`, phase/battle decisions) from editing commands (`CorrectState`, setup placement). Corrections are invalid in Rules mode.

Proposed conceptual interface:

```ts
type Verdict = 'legal' | 'illegal' | 'unverified';

type Preview = {
  verdict: Verdict;
  expectedRevision: number;
  reasons: Array<{ code: string; message: string; source?: string }>;
  warnings: string[];
  cost: {
    prayer: number;
    actionSlotId?: string;
    tokenId?: string;
    breakdown: Array<{ reason: string; amount: number; source: string }>;
  };
  route?: RouteLeg[];
  effects: EventPreview[];
  requiresDecision?: string;
};

preview(state, command): Preview
execute(state, command, { expectedRevision, commandId }): Result
```

This is a design interface, not shipped TypeScript. Ordinary JavaScript with validated objects/JSDoc is sufficient.

Preview is pure. Confirm revalidates against the current revision. If prayer, an action slot, a unit count, an interrupt, or a relevant effect changed, the old preview expires. If `commandId` has already executed, return its existing receipt, not another payment or movement.

For non-interrupted actions, validate and compute all mutations on a copy, check invariants, then commit once. A failed pyramid payment must not increase the pyramid; a failed recruitment must not remove prayer; a failed merge must not remove the origin troop.

For interruptible movement, atomically commit each executed segment plus its continuation state. The action token is spent once when the action begins; costs for unexecuted later legs are not spent prematurely. Close or reload cannot abandon this continuation silently.

## 6. Movement engine

### Reachability is stateful, not a simple distance circle

A candidate search state includes current region, original movement-start region, carried units/creature, ground movement remaining, prayer remaining, pickups/drop-offs, applicable effects, and whether an enemy/interruption was reached. The original movement-start region is needed for the M6 wall rule.

Generate neighbors using:

1. Enabled ordinary adjacencies: consume one ordinary movement step.
2. Printed harbor links: consume one ordinary movement step and no extra base prayer.
3. Eligible origin pyramid → enabled obelisk: consume base two prayer and zero ordinary movement steps (M5).

Apply verified effects to those transition costs, eligibility, and range. Validate troop caps, one-creature-per-space, original-start wall eligibility, and opposing presence. Enemy entry yields a terminal route candidate requiring battle or an applicable pre-battle response, not a pass-through edge.

Keep alternatives that trade ordinary steps against prayer; the shortest route in steps is not always the least expensive route. Reject dominated states with the same relevant troop/effect configuration. Prune cycles, including zero-cost teleport cycles if a verified power creates them. Never prune away a legal pickup/drop-off state just because it shares a region with another path.

The UI highlights only destinations backed by a complete validated route. Unknown effect behavior results in `unverified`. A textual explanation for a blocked space uses the same transition validator as Confirm.

### User control over routes

When several valid routes reach the same destination, present at least their movement/prayer trade-offs. The user may tap intermediate regions to build a route. Display pickups/drop-offs as separate visible choices rather than silently moving every friendly unit encountered.

Before execution, replay the selected route using the actual validator; do not trust cached search results. Preserve a receipt listing each leg, step/prayer cost, carried units, and interruption. A creature's removal or reassignment must recalculate any range/effect it supplies according to verified rules.

## 7. Economy and action-space validators

Run common checks first: correct phase, correct actor, no unresolved blocking action, valid unoccupied action slot, available token, future row coverage, and known effect coverage.

For the standard five-token requirement, after a proposed slot placement compute how many of the first three rows remain uncovered. That number cannot exceed the remaining standard tokens, and each missing row must still have an eligible placement. Power-granted special actions must use their own verified semantics rather than being folded into this shortcut.

### RaisePyramid

For current level `L` and target `T`, compute base cost `sum(L+1 ... T)`, restrict to one pyramid, and reject invalid or downward targets in normal play. Apply individually defined discounts/free-effect contexts. Check affordability and legal target access, then commit payment, occupied slot, level, and resulting derived control/VP together. Keep questions about upgrading captured enemy pyramids unverified until the source check resolves them; ownership of benefits alone is not proof of upgrade permission.

### Recruit

Preview a distribution over eligible own-city districts, not a single unqualified plus button. Validate total reserve, per-space limits, verified discounts, and cost. An occupied own-city district can generate an attack as M5 specifies. Multiple triggered battles require an explicit ordered resolution state; do not merge them into one summed combat or leave both colors peacefully co-located.

### BuyPower

Check a real supply instance, correct buy-color slot, controlled pyramid access of the required color/level, effect-equivalence duplicates, cost modifiers, affordability, and supported acquisition effects. A tile already owned by either player is not a purchasable supply tile. Mirror reassignment is a different command.

### Effect accounting

Use typed hooks such as `movementAllowance`, `movementPermission`, `teleportCost`, `recruitCost`, `pyramidCost`, `powerCost`, `battleStrength`, `battleDamage`, `battleProtection`, `nightEffect`, and `onAcquire`. Every hook has a source and phase. Do not implement a growing set of unreviewed `if (name === ...)` clauses scattered through UI handlers.

Cost receipts show base cost and each modification. Do not apply Priest of Ra's pyramid reduction per level: the supplied M8 FAQ distinguishes the per-action limit. Do not treat a free Night upgrade as a paid Day action.

## 8. Battle, phases, information, and scoring integration

The selected movement route creates combat at the correct region and makes the moving player the attacker. Keep V2's independent battle hands, defender-wins-ties resolution, capped casualties, and survivor-based ordinary attacking battle VP. Verify special effects before extending the calculation.

The battle state machine must not stop at `result`:

`entry → pre-battle responses → card/effect commitments → reveal → outcome → casualties → retreat/recall decisions → creature relocation → control recalculation → action completion`

M7 permits recall by either side and awards prayer per recalled unit; recall is not a partial withdrawal. The defeated troop's retreat destination is chosen by the winner from eligible empty adjacent spaces. The winner-with-no-troops exception must be handled explicitly. Resolve these rules from their source, not from a generic winner-keeps-space assumption.

Separate public automatic modifiers from hidden DI selections. Do not give the AI the human's concealed hand or actual hidden discard. Special information powers may change who learns what and when; support them only with an explicit source-backed timing rule. The ordinary battle-card heuristic does not need an external model.

Use `setup → Day/action cycles → end-Day distributions/check → Night preparation → next Day`, with a specifically reviewed initial phase fixture. The purpose is to prevent double grants and wrong timing, not to silently choose how the first Night interacts with setup. M3 governs Night order; M8 governs end-Day income, objective awards, win timing and tie breaks. Freeze normal actions while phase choices are unresolved.

Derived temporary VP includes applicable temple and level-4 pyramid control. Store permanent VP by event category so the M8 battle-VP tie-break can be computed. Existing V2 aggregate VP is not sufficient evidence of those categories.

## 9. Migration and safety without a security project

Create a new V3 storage key and schema. Never overwrite a V2 save in place or silently reset malformed data. Preserve the original export and report validation failures.

A V2 import starts in Mirror/setup: the old save lacks a verified topology, occupied action slots, phase history, and VP categories. Match known regions/components where possible, then offer tap-based review for ambiguous mappings and missing metadata. The count of remaining actions must not be used to invent which rows were played. Returning to Rules mode requires completion of that review or an explicitly agreed fresh-round checkpoint.

While storage is blocked, keep controls working in memory and show a persistent backup warning. Invalid imports leave the current valid state intact. Prevent double taps and stale previews through command IDs/revisions, not server authentication. Before any hidden-information reveal, draft cancellation is ordinary; after a reveal, an undo is an explicit correction with a warning, not an invisible reset of the AI decision.

## 10. Test matrix: new behavior, not just syntax

These are required tests to implement, not claims that they currently pass.

| ID | Scenario | Expected result |
| --- | --- | --- |
| MAP-01 | Compare all region IDs and polygons with graph data | No decorative-only playable region; no missing enabled region. |
| MAP-02 | Two-player profile | East Bank disabled; correct physical board side and objective list. |
| MOV-01 | Base adjacent ground move | One ordinary step; one appropriate Move token total. |
| MOV-02 | Two-step ground route, base allowance one | Block before mutation. |
| MOV-03 | Two ordinary steps with a verified range increase | Legal if other constraints pass; never a second action charge. |
| MOV-04 | Teleport from a qualifying pyramid | Two base prayer; zero ordinary steps. |
| MOV-05 | Teleport with one prayer or no valid origin pyramid | Block with exact reason. |
| MOV-06 | Combined teleport plus ground route | Correct separate budgets and displayed receipt. |
| MOV-07 | Friendly arrival at the troop cap / above it | Allow cap; reject overflow; no lost units. |
| MOV-08 | Split, pickup and drop-off on a multileg route | Unit conservation and creature constraints at each relevant state. |
| MOV-09 | Enemy entry before intended final destination | Stop and open battle at first enemy. |
| MOV-10 | Supported Escape interrupt | Cancel battle and resume the same Move, not a new action. |
| WALL-01 | Movement begins adjacent to enemy city | Permit wall entry when all other rules pass. |
| WALL-02 | Movement only becomes adjacent partway through | Block entry without a verified exception. |
| WALL-03 | Own city's wall / verified Open Gates case | Apply the correct owner/exception behavior. |
| PYR-01 | Level 1 → 3, seven prayer, eligible action | Level 3, two prayer remaining, one slot/token spent. |
| PYR-02 | Same upgrade with four prayer | Nothing changes. |
| PYR-03 | Level 2 → 4 | Base cost seven, not two or four. |
| PYR-04 | Cancel, double confirm, stale receipt | Zero charge / one charge / require new preview. |
| PYR-05 | Try downgrade or reuse occupied Raise slot | Block in Rules mode. |
| PYR-06 | Supported free Night effect | Correct phase; no accidental ordinary action use. |
| PYR-07 | Priest of Ra multilevel discount | Discount once per action as M8 specifies. |
| ACT-01 | Reuse action space or act in wrong phase/turn | Block. |
| ACT-02 | Proposed placement makes three-row coverage impossible | Block without spending token. |
| REC-01 | Recruit beyond reserve, insufficient prayer, or troop overflow | Atomic rejection. |
| REC-02 | Recruit into opponent's city / occupied own district | Reject former; trigger supported attack for latter. |
| POW-01 | Tile already owned or duplicate equivalent effect | Block paid purchase. |
| POW-02 | Insufficient same-color pyramid access | Block; never waive because prayer is sufficient. |
| POW-03 | Valid controlled enemy pyramid access | Apply only the permitted purchase benefit. |
| CRE-01 | Merge troops both carrying creatures | No silent deletion; require legal resolution or reject. |
| BAT-01 | Four successive battles including a reload | Independent hands recover; committed choices never change. |
| BAT-02 | Winner with no survivors; defender win; repeated apply | Correct VP eligibility and no duplicate award. |
| BAT-03 | Practice battle | Real board, costs, and score unchanged. |
| PH-01 | End-Day threshold and tie-breaks | Use original M8 timing/categories. |
| FX-01 | Unknown relevant power/DI effect | `unverified`, not legal and not falsely illegal. |
| MIG-01 | Import V2 / invalid JSON | Review mode / preserve existing valid game. |
| UI-01 | Tap source, quantity, route, Confirm/Cancel | Visible path and matching receipt; preview is non-mutating. |
| UI-02 | Blocked browser storage | Buttons still work; backup warning stays visible. |
| UI-03 | Reload during move interruption and battle selection | Resume exact pending state. |
| UI-04 | Phone portrait/landscape, zoom, reduced motion | No covered destination or unreachable confirmation controls. |
| REL-01 | Deployed page and asset hashes | Match the tested commit, not an older cached demo. |

Also add randomized invariant tests: no negative prayer, total units conserved except explicit reserve/death transitions, maximum 12 owned units, no duplicate power instance/creature, no action spent twice, no unrecorded resource changes, and no peaceful mixed occupancy outside setup or an active battle.

Test synthetic graph fixtures to establish the movement algorithm, then independently test the actual audited board. Passing tests on an invented test map does not verify the physical map.

## 11. Delivery order and release gates

### Milestone 1 — rules and topology foundation

Record the existing defects as regression tests; audit the board graph, action board, base component identities, and rule provenance. Add the mode boundary, schema, revisioned commands, and resource receipts. Block unverified mechanics. Exit: movement/cost tests cannot be passed by editor shortcuts.

### Milestone 2 — paid actions and movement UX

Implement RaisePyramid first as the smallest end-to-end transactional action, then Pray, Recruit, BuyPower, and full movement-route preview/confirmation. Add destination overlays and separate ground/prayer accounting. Exit: the core user complaints are covered by reproducible tests.

### Milestone 3 — connected game lifecycle

Connect enemy entry to battle and aftermath, creature relocation, phase progression, and derived scoring. Add verified component-effect hooks incrementally. Exit: the supported rules profile does not strand unresolved board state or allow unpaid effects.

### Milestone 4 — visual polish and phone release

Polish built-in board composition, troop identity, pyramid levels, card readability, and visible route animation. Keep the same validated actions beneath the graphics. Run core and browser tests in Chromium/WebKit at phone and desktop viewports, deploy a versioned preview, compare published assets with the tested commit, and repeat the interaction flows against the live HTTPS URL.

Keep `/v2/` intact while V3 is being built. Publish `/v3/` only when it exists and passes its declared gate; do not send another downloadable HTML file as the primary phone testing route. A visible release label must distinguish a verified base-action build from a fully supported original-game build. Never describe incomplete component effects or a local battle heuristic as a rules-complete autonomous opponent.

## 12. Agent handoff: non-negotiable implementation instructions

Implement against document A and this plan, starting with the source-backed tests and command layer. Do not replace the user's requested work with another specification loop. Do not fix free pyramid rotation by adding only a warning over the old free setter. Do not add green destination highlighting without a verified movement graph. Do not bypass costs for AI actions. Do not ask the player to type card statistics or re-upload the board. Preserve V2 saves, independent hands, and public/private information boundaries. Unknown rules must be reported explicitly. The deliverable is working hosted behavior with tested action receipts, not merely parsing JavaScript or drawing a better board.
