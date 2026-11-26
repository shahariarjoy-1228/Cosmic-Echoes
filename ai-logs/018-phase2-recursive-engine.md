# AI Interaction — 018

## User Prompt (attachment)

# Cosmic Echoes — Phase 2 Implementation

## Role

Act as a senior JavaScript engineer and creative-coding developer.

You are implementing Cosmic Echoes, a browser-based recursive procedural music application for the Hub's Quest Epoch 1 solo hackathon.

The developer is a JavaScript beginner. Keep the implementation modular, readable, reliable and easy to explain.

## Workspace

E:\Projects\cosmic-echoes

## Preparation

Before modifying anything, inspect the repository and read:

- AGENTS.md
- README.md
- docs/PROJECT_PLAN.md
- docs/ARCHITECTURE.md
- docs/HACKATHON_REQUIREMENTS.md
- docs/PROGRESS_LOG.md
- docs/TESTING.md
- PROMPT_CHAIN.md

Check the recorded Phase 1 status and Git working tree.

Report any unresolved Phase 1 verification or archive issues honestly. Do not fabricate completion or transcripts.

The developer explicitly authorizes Phase 2 implementation. Preserve existing uncommitted work.

## Scope

Implement Phase 2 only: Recursive Celestial Echo Engine.

Do not implement musical mapping, audio synthesis, Canvas rendering, WAV export or the complete user interface yet.

## Task 1 — Recursive Generator

Create js/recursion.js using native JavaScript ES module exports.

Implement a genuine recursive celestial echo generator.

The generator must:

1. Accept a root star position, root identifier, configuration parameters and start time.
2. Generate the root celestial event.
3. Recursively generate smaller child echoes.
4. Preserve parent-child relationships.
5. Reduce child radius and amplitude using the configured decay factor.
6. Calculate child positions from parent position, propagation direction and spread angle.
7. Calculate child event timing.
8. Stop at the configured maximum depth.
9. Return deterministic event data.
10. Never directly access the DOM, Canvas or Web Audio API.

Use a clearly identifiable recursive function with an explicit base case.

Do not replace the recursive algorithm with only an iterative simulation.

## Task 2 — Configuration and Validation

Implement or export a reusable default configuration and validation function.

Follow these specifications:

- Default maximum depth: 3.
- Allowed depth: integers from 0 through 4.
- Default children per star: 2.
- Allowed children per star: integers from 1 through 3.
- Default decay: 0.65.
- Allowed decay: 0.35 through 0.85.
- Default spread angle: 100 degrees.
- Allowed spread angle: 30 through 180 degrees.
- Default base generation delay: 0.8 seconds.
- Allowed base generation delay: 0.4 through 2 seconds.
- Default tempo: 55 BPM.
- Allowed tempo: 40 through 80 BPM.
- Root coordinates normalized to 0 through 1.
- Root amplitude constrained to 0 through 1.
- Maximum events per root: 121.
- Global pending and active recursive event budget: 300 combined.

Actual generation delay:

configured generation delay × 55 / selected BPM

Validate all numeric inputs.

For non-finite or missing values, restore appropriate defaults or explicitly reject invalid required arguments.

Clamp finite values that exceed allowed boundaries.

Round integer-only parameters and then clamp them.

Do not silently permit NaN, Infinity, negative depths or unbounded recursion.

Do not mutate configuration objects supplied by the caller.

## Task 3 — Event Data Contract

Each celestial event must provide:

- id
- rootId
- parentId
- x
- y
- depth
- radius
- angle
- startTime
- duration
- amplitude
- childIndex

Use normalized coordinates, radians for internal angular calculations and seconds for timing.

Use null for the root event's parentId and childIndex.

Generate stable deterministic event identifiers from the supplied root identifier and recursive child path.

Ensure IDs are unique within a generated tree.

Document that the future application controller must provide distinct root identifiers for different accepted placements.

Ensure parents appear before their descendants in the returned event collection.

Define and document a predictable event ordering.

Child events must not start before their parent events.

Keep generated positions within normalized canvas bounds.

Use a simple, deterministic method for handling boundary conditions and document it.

Use a positive, finite visual radius and duration.

Child radius and amplitude must progressively decrease according to the decay factor.

Keep event duration and generation delay as distinct concepts.

## Task 4 — Event Budget Protection

Implement a pure helper that calculates the expected number of events for a specified depth and branching factor.

Provide a capacity-check helper that determines whether an entire proposed recursive tree fits within the remaining global event budget.

Do not generate partial trees when the remaining capacity is insufficient.

Do not queue rejected placements.

Return an explicit rejection result or provide a clear mechanism for the future controller to decline the placement.

The generator must independently enforce its per-root safety limit.

The actual tracking of active and pending events across multiple placements will be handled during application integration. Do not claim that application-level enforcement already exists.

Document the interface that the future application controller must use.

## Task 5 — Testing

Create a dependency-free test page:

tests/recursion.test.html

Create a corresponding test module:

tests/recursion.test.js

Use native JavaScript and simple assertion helpers.

Do not install npm packages or testing frameworks.

The test page should display individual PASS or FAIL results and an overall test summary.

Test at least:

1. Depth 0 with two children produces exactly one event.
2. Depth 1 with two children produces exactly three events.
3. Depth 2 with two children produces exactly seven events.
4. Depth 3 with two children produces exactly fifteen events.
5. Depth 4 with two children produces exactly thirty-one events.
6. Depth 4 with three children produces exactly 121 events.
7. Depth 4 with one child produces exactly five events.
8. Invalid negative depth is safely handled.
9. Excessive depth is safely handled.
10. Non-integer depth and child count are safely handled.
11. NaN and Infinity inputs are safely handled.
12. Missing configuration values receive defaults.
13. Every event identifier is unique within its tree.
14. Every non-root event references a valid parent.
15. Child depth equals parent depth plus one.
16. Child radius decreases.
17. Child amplitude decreases.
18. Child start time follows the parent start time.
19. Generated positions remain within normalized bounds.
20. Identical inputs produce identical results.
21. Different root identifiers produce distinct event identifiers.
22. The generator does not mutate its input configuration.
23. Tempo correctly affects generation delay.
24. The capacity checker accepts a tree that exactly fits the remaining budget.
25. The capacity checker rejects a tree that exceeds the remaining budget.
26. Maximum per-root limits are respected.
27. Generated numeric values are finite.
28. Event durations are positive.

Do not report tests as passed unless they were actually executed.

If browser execution is unavailable, explain how the developer can run the test page and record the results.

## Task 6 — Documentation

Update the relevant project documentation:

- docs/ARCHITECTURE.md
- docs/PROJECT_PLAN.md
- docs/PROGRESS_LOG.md
- docs/TESTING.md
- README.md
- AGENTS.md, if the current-phase marker requires updating

Document the actual exported functions and event contract.

Explain the recursive case, base case, event count formula and complexity.

Record implementation status accurately.

Keep unexecuted application tests pending.

Do not mark Phase 2 as fully complete until the required recursive engine tests have been verified.

Do not claim that audio, visualization or export features are implemented.

## Constraints

- HTML and vanilla JavaScript only for this phase.
- No external runtime dependencies.
- No Node.js or npm requirement.
- No frameworks.
- No backend.
- No paid APIs.
- No Web Audio implementation.
- No Canvas implementation.
- No unnecessary changes to index.html, style.css or app.js.
- Preserve existing documentation and AI records.
- Do not fabricate AI transcripts.
- Do not modify Git history.
- Do not commit or push changes automatically.

## Final Report

After completing the implementation, provide:

1. Files created.
2. Files modified.
3. Explanation of the recursive algorithm in beginner-friendly language.
4. Public module exports and usage.
5. Example generated event.
6. Validation and event-limit behavior.
7. Tests actually executed and their results.
8. Tests still requiring manual verification.
9. Known limitations and unresolved issues.
10. Exact instructions for running the test page.
11. Phase 2 readiness status.

Implement Phase 2 now. Do not begin Phase 3.

## Agent Response

**Phase 2 is complete as a standalone engine.** The browser suite passed **32 of 32 tests** in headless Microsoft Edge over local HTTP. Phase 3 has not started.

- **Created** `js/recursion.js`, `tests/recursion.test.html`, `tests/recursion.test.js`, and the Phase 2 transcript in `ai-logs/018-phase2-recursive-engine.md`.
- **Updated** `README.md`, `AGENTS.md`, `PROMPT_CHAIN.md`, and `docs/ARCHITECTURE.md`, `docs/PROJECT_PLAN.md`, `docs/PROGRESS_LOG.md`, and `docs/TESTING.md`.

### How it works

The engine adds the root event, then calls the same function for each child. Every child travels in a direction derived from its parent, starts one generation delay later, and has a smaller radius and lower amplitude unless the root is silent. The function stops branching at the configured depth. It returns parents before their descendants in depth-first order, with coordinates clamped to the canvas edges.

```js
import { canFitTree, generateEchoTree } from "./js/recursion.js";

const config = { maxDepth: 0 };
const events = canFitTree(config, 0)
  ? generateEchoTree({ id: "star", x: 0.5, y: 0.5 }, config, 0)
  : [];
```

The root event has `id: '["star"]'`, `rootId: "star"`, `parentId: null`, `x: 0.5`, `y: 0.5`, `depth: 0`, `radius: 0.12`, `angle: -Math.PI / 2`, `startTime: 0`, `duration: 1.2`, `amplitude: 1`, and `childIndex: null`.

The module also exports `DEFAULT_CONFIG`, `validateConfig`, `countEvents`, `MAX_EVENTS_PER_ROOT` (121), and `GLOBAL_EVENT_BUDGET` (300). Validation defaults missing or non-finite settings, rounds and clamps bounded settings, and rejects invalid required root data. The future controller must supply distinct root IDs and the current pending-plus-active count to `canFitTree` before accepting a placement.

### Testing and remaining work

From the project root, run `python -m http.server 8000 --bind 127.0.0.1` with an existing Python installation, or use any static HTTP server. Open `http://127.0.0.1:8000/tests/recursion.test.html` and check the summary and individual results. Stop the server with Ctrl+C.

The automated browser run verified counts, validation, event relationships, determinism, timing, and capacity checks. Manual browser inspection and application-level integration, playback, rendering, listening, and export checks remain pending. Phase 1 transcript gaps are still open. The app entry files were untouched, and nothing was committed or pushed.
