# AI interaction S08

## User Prompt

Original submitted task attachment (Pasted text.txt).

# Cosmic Echoes — Phase 6 Implementation

## Role

Act as a senior JavaScript engineer, Web Audio API specialist, real-time application architect and creative-coding developer.

You are implementing Cosmic Echoes, a browser-based recursive procedural music application for the Hub's Quest Epoch 1 solo hackathon.

The developer is a JavaScript beginner. Keep the implementation modular, understandable, reliable, maintainable and easy to demonstrate.

Prioritize functional integration, synchronization accuracy, pleasant user experience and reliable completion of mandatory hackathon requirements.

Preserve the existing four independently implemented engines wherever possible.

## Workspace

E:\Projects\cosmic-echoes

## Preparation

Before modifying any files, inspect the repository and read:

- AGENTS.md
- README.md
- docs/HACKATHON_REQUIREMENTS.md
- docs/ARCHITECTURE.md
- docs/PROJECT_PLAN.md
- docs/PROGRESS_LOG.md
- docs/TESTING.md
- PROMPT_CHAIN.md
- js/recursion.js
- js/music.js
- js/audio.js
- js/visuals.js
- All existing automated test modules.
- Existing audio and visual demonstration pages.

Inspect the actual implemented public interfaces, event contracts, identifier formats, configuration conventions, transport behavior, scheduler internals, resource limits and event-pruning behavior.

Previously reported verification:

- Recursion: 32/32 automated tests passed.
- Musical mapping: 69/69 automated tests passed.
- Procedural audio: 23/23 automated tests passed.
- Visual engine: 15/15 automated tests passed.
- Combined automated results: 139 passed, 0 failed, 0 skipped.
- Developer-reported manual audio verification: 20/20.
- Developer-reported manual visual verification: 29/29.

The Phase 5 closure did not rerun the automated suites.

Measured visual frame rate and mobile touch verification remain unreported.

Check the current Git working tree.

Preserve all existing uncommitted implementation and documentation changes.

Report outstanding archive issues honestly.

Do not fabricate missing transcripts or test results.

The developer explicitly authorizes Phase 6 implementation.

## Scope

Implement Phase 6 only: Audio-Visual Synchronization.

Build a centralized application controller integrating the existing recursive engine, musical mapper, procedural audio engine and visual engine.

Create a standalone synchronized demonstration page.

Support dynamic star placement during playback, synchronized transport controls, shared event capacity, bounded composition recording and deterministic replay.

Prepare a reliable composition snapshot for future offline WAV export.

Do not begin Phase 7.

Do not implement WAV encoding or audio download functionality.

Do not implement the complete final application interface or optional creative features belonging to later phases.

---

## Task 1 — Central Application Controller

Create:

js/controller.js

Use native JavaScript ES module exports.

Implement an understandable controller class or factory.

Suggested name:

CosmicEchoesController

The controller must coordinate:

1. Recursive celestial event generation.
2. Musical event mapping.
3. Audio engine initialization.
4. Audio scheduling.
5. Visual event acceptance.
6. Shared event capacity.
7. Root identifier generation.
8. Playback state transitions.
9. Composition recording.
10. Replay.
11. Musical environment selection.
12. User configuration.
13. Diagnostics and error reporting.
14. Resource cleanup.

Use the existing recursion, music, audio and visual modules.

Do not duplicate their algorithms.

Keep DOM-specific controls outside the core controller where practical.

Accept dependencies or engine instances through a clear interface if this improves testability without introducing unnecessary abstraction.

The controller must be the authoritative coordinator of application-level state.

Do not create AudioContext or start playback automatically on module import.

Do not start an independent composition clock in the controller.

---

## Task 2 — Existing Engine Compatibility

Inspect the actual existing implementations.

### Recursive engine

Determine the exact signatures for:

- Configuration validation.
- Recursive tree generation.
- Expected event count calculation.
- Capacity checking.

Preserve the existing recursive event contract.

### Musical mapper

The reported public interface includes:

- mapCelestialEventsToMusic(events, config)
- generateAmbientHarmony(config, startTime, duration)
- planMelodicVoices(notes, voiceLimit)

Verify these signatures.

Preserve deterministic parent-child musical inheritance.

Do not recalculate pitches or apply another tempo adjustment.

### Audio engine

The reported public interface includes:

- new AudioEngine(config)
- initialize()
- loadComposition({ notes, ambient, duration })
- play()
- pause()
- resume()
- stop()
- reset()
- dispose()
- Mix setters.
- getPlaybackPosition().
- Playback state and diagnostic methods.

Inspect whether dynamic note insertion during playback is already supported.

If not, implement the smallest reliable extension necessary.

### Visual engine

The reported interface includes:

- new VisualEngine(canvas, config)
- addEvents(batch)
- renderAt(seconds)
- start(timeProvider)
- pause()
- resume()
- stop()
- resize()
- clear()
- reset()
- dispose()
- getDiagnostics()

Inspect its event validation, capacity accounting and expired-event pruning behavior.

Preserve the existing public contracts unless an actual compatibility issue requires a backward-compatible extension.

Document all necessary changes to existing engines.

Do not rewrite working synthesis, musical mapping or rendering functionality.

---

## Task 3 — Shared Authoritative Timeline

Use the existing audio engine as the authoritative composition clock.

The visual engine must obtain its current time through the equivalent of:

visualEngine.start(() => audioEngine.getPlaybackPosition())

Or:

visualEngine.renderAt(audioEngine.getPlaybackPosition())

Use the approach best suited to the actual visual engine implementation.

Requirements:

- All celestial and musical event onsets use composition-relative seconds.
- AudioContext.currentTime remains the underlying playback clock.
- The controller must not use Date.now or performance.now as an alternative authoritative composition clock.
- requestAnimationFrame may drive rendering but must not determine musical timing.
- JavaScript timers may support scheduling and diagnostics but must not independently advance the composition timeline.
- Recursion remains responsible for tempo-adjusted generation delays.
- Music, audio and visual modules must not apply duplicate tempo scaling.
- Rendering must preserve the original celestial event onset.
- Audio scheduling must preserve the corresponding musical event onset.

During active playback, getPlaybackPosition must represent a finite, monotonic composition-relative time.

During pause, both audio and celestial animation must freeze at the same transport position.

During stop, both engines must return to their documented initial transport state.

Account for natural completion.

Distinguish composition time, audio-context time and physical output latency.

If supported, investigate AudioContext.getOutputTimestamp or relevant latency information for diagnostic purposes.

Do not introduce speculative hardware latency corrections that create inconsistent timing.

Document that browser rendering and audio hardware buffering prevent a universal guarantee of perfect physical synchronization.

Target accurate shared-timeline synchronization.

---

## Task 4 — Controller Configuration

Implement immutable controller defaults and validation.

Reuse existing module defaults rather than creating conflicting copies of their configuration rules.

The integrated experience must respect:

- Maximum recursion depth: 4.
- Maximum children per star: 3.
- Maximum events per root: 121.
- Maximum combined pending and active recursive events: 300.
- Maximum simultaneous logical melodic voices: 8.
- Maximum ambient pad voices: 2.
- Maximum atmospheric layers: 1.
- Default composition duration: 60 seconds.
- Maximum supported audio tail: 4 seconds.

Introduce a small configurable scheduling lead for live placement.

Suggested initial value: 0.15 seconds.

The lead must be long enough for validation, mapping and audio scheduling, while remaining responsive to user interaction.

Validate and bound it consistently with the actual scheduler.

Do not silently change existing recursion parameters.

Separate:

- Recursive configuration.
- Musical configuration.
- Audio configuration.
- Visual configuration.
- Controller and recording configuration.

Missing optional values should receive documented defaults.

Non-finite optional numeric values must be handled safely.

Reject structurally invalid required arguments.

Do not mutate caller-owned configuration objects.

---

## Task 5 — Interactive Live Star Placement

Implement a controller method equivalent to:

placeStar(x, y)

The operation must support placement while the composition is playing.

Required workflow:

1. Verify the controller lifecycle state.
2. Validate normalized coordinates.
3. Capture the current validated recursion configuration.
4. Capture the applicable musical configuration.
5. Read the authoritative audio transport position.
6. Calculate a suitable future composition-relative root onset using the scheduling lead.
7. Calculate the proposed tree's expected recursive event count.
8. Check the shared pending and active event capacity.
9. Check the composition recording capacity.
10. Check that the complete proposed tree fits inside the remaining composition duration.
11. Allocate a unique root identifier.
12. Generate the complete recursive tree using recursion.js.
13. Map the exact same celestial event collection through music.js.
14. Validate that both engines can accept the proposed data.
15. Commit the accepted tree to the audio scheduler, visual renderer and composition recorder.
16. Return clear acceptance information.

The audio and visual paths must consume the same generated celestial event collection.

Do not generate separate recursive trees for each engine.

Do not generate unrelated visual positions or musical notes.

Future placements may use changed recursion settings, but accepted event trees must retain their original parameters and timing.

Use a stable session-local identifier strategy that prevents collisions across multiple accepted root trees.

Respect the actual identifier format used by recursion.js.

Support mouse, touch and pen placement through the demo page.

Also support keyboard-accessible coordinate placement.

Avoid creating multiple trees from one pointer action.

Do not generate trees continuously on pointermove.

---

## Task 6 — Placement Behavior Across Playback States

Define and document placement behavior in every controller state.

Recommended behavior:

### Before first playback

Do not autoplay sound.

A placement may either prepare a composition at time zero or require the user to explicitly begin the session.

Choose a simple, predictable policy.

### During playback

Accept valid new trees at the current audio-relative position plus the scheduling lead.

Do not restart the audio graph.

### During pause

Prefer rejecting live placement with a clear instruction to resume playback.

Alternatively, support placement against the frozen timeline only if its behavior is well-defined and fully tested.

Do not silently resume audio.

### After stop

Use the documented session reset or prepared-composition behavior.

Do not accidentally append to the previous recording.

### During replay

Prefer disabling new star placement to preserve deterministic replay.

The user should explicitly begin a new recording session before editing the composition.

### During disposal

Reject all placement attempts.

Prevent asynchronous pending operations from recreating resources.

Keep these rules simple and visible in the demo interface.

---

## Task 7 — Atomic Event Acceptance

A placement must be accepted as one complete transaction.

Do not allow these inconsistent outcomes:

- Audio notes accepted but their visual events rejected.
- Visual events accepted but their musical data missing due to an unexpected insertion failure.
- A partial recursive tree added to either engine.
- Rejected placement incorrectly recorded as accepted.
- Event capacity reserved indefinitely after failure.

Implement a prepare, validate and commit workflow.

Where necessary, add backward-compatible validation or reservation capabilities to the existing engines.

Validate all structural data and capacity requirements before irreversible scheduling operations occur.

Serialize placement mutations or otherwise ensure rapid concurrent actions cannot overbook shared capacity.

If a commit operation fails unexpectedly, restore consistent state using rollback, cancellation of unsounded scheduled sources or another documented recovery mechanism.

If full rollback cannot be guaranteed after an audible note starts, prevent that condition through staging and future-onset reservation.

If consistency cannot be restored, stop the affected session safely and report the error rather than allowing silent divergence.

Musical voice suppression is not a placement failure.

An accepted celestial tree may contain suppressed musical notes, provided the complete visual structure remains intact and suppression decisions are recorded.

Do not queue rejected placements.

Return explicit rejection reasons, such as:

- Invalid coordinates.
- Invalid configuration.
- Insufficient recursive event capacity.
- Insufficient recording capacity.
- Insufficient remaining session duration.
- Invalid playback state.
- Audio engine unavailable.
- Internal integration failure.

Document actual atomicity guarantees and limitations.

---

## Task 8 — Centralized Event Capacity

Enforce the shared limit of 300 pending plus active recursive events.

Maintain an authoritative controller-side capacity calculation using accepted celestial event lifetimes.

A celestial event remains occupied from acceptance until its documented visual expiration.

Count pending and active events together.

Do not count an accepted celestial event twice simply because it appears in both audio and visual modules.

Use existing recursion expected-count and capacity-check helpers where appropriate.

Reject a proposed tree when its entire event count cannot fit.

Do not partially generate or accept the tree.

Expired visual events must release recursive occupancy.

The audio engine's separate release-aware melodic voice registry must continue protecting the eight-voice limit even when a celestial event has expired.

Maintain distinct limits for:

- Pending and active recursive events.
- Actual audio voice resources.
- Historical recorded events.
- Historical parent metadata.
- Pending scheduling data.

Do not use the visual renderer's current visible event count as the sole source of global occupancy.

The visual renderer may already have pruned an event while audio resources or composition recording information remain relevant.

Expose diagnostic snapshots for:

- Pending celestial events.
- Active celestial events.
- Occupied recursive capacity.
- Remaining recursive capacity.
- Accepted root count.
- Rejected placement count.
- Recorded event count.

Ensure repeated placements cannot create unbounded memory growth.

---

## Task 9 — Dynamic Audio Event Insertion

Inspect the existing audio scheduler.

If live event insertion is missing, extend audio.js minimally.

Suggested interface:

appendNotes(notes)

A more appropriate name may be chosen to match existing conventions.

Requirements:

1. Accept validated future musical events during active playback.
2. Preserve their exact composition-relative onsets.
3. Insert them into the existing bounded chronological scheduling queue.
4. Preserve the existing audio-context timeline.
5. Do not call loadComposition in a way that resets playback.
6. Do not recreate the shared audio graph for each root.
7. Do not restart ambient harmony.
8. Do not recreate the atmosphere layer.
9. Do not duplicate existing scheduled notes.
10. Detect identifier collisions.
11. Enforce the existing late-event policy.
12. Retain deterministic ordering for simultaneous candidates.
13. Preserve runtime voice-limit enforcement.
14. Support cancellation of unsounded staged notes where needed for atomic integration.
15. Bound the number of queued and active resources.

Completed audio queue entries should be removed or compacted when safe.

Composition recording must remain separate from active audio queue storage.

Ensure that dynamically appended notes cannot exceed the session's supported endpoint.

Do not alter the approved instrument synthesis settings.

Do not alter established note frequencies, duration mappings, pan values or recursive timing.

If the original audio API has a fixed composition-length constraint, preserve it and integrate dynamic placement within that limit.

---

## Task 10 — Release-Aware Runtime Polyphony

Preserve the existing audio engine's voice accounting.

Reported release tails:

- Starlight: 220 milliseconds.
- Echo: 160 milliseconds.
- Nebula pad: 600 milliseconds.

Verify these values against the actual source.

The maximum melodic voice count remains eight.

Include:

- Already sounding notes.
- Scheduled overlapping notes.
- Attack and decay.
- Release intervals.

Do not reset the voice count for each new root tree.

Static voice planning performed separately per root is insufficient for integrated playback.

Apply the existing release-aware audio admission policy across all accepted root trees.

Preserve already sounding voices where possible.

When simultaneous new candidates compete, retain the documented root and shallow-depth priority.

Use deterministic tie-breaking.

Report suppressed notes and their reasons.

Distinguish:

- Raw mapped musical events.
- Notes admitted to actual audio scheduling.
- Zero-intensity notes.
- Capacity-suppressed notes.
- Late-event suppression.
- Notes cancelled before their onset.
- Notes interrupted by a session stop.

Do not delete the corresponding celestial event merely because its musical note is suppressed.

The visual representation must continue to show the genuine recursive structure.

---

## Task 11 — Musical Environment Coordination

Support the three existing environments:

### Deep Space

- Musical scale: c-major-pentatonic.
- Visual theme: deep-space.

### Nebula Dreams

- Musical scale: a-minor-pentatonic.
- Visual theme: nebula-dreams.

### Solar Harmony

- Musical scale: f-major-pentatonic.
- Visual theme: solar-harmony.

Use the actual existing identifiers.

Coordinate the selected musical scale and visual theme.

Do not duplicate scale definitions or visual theme registries.

For Phase 6, prefer locking the musical environment for an active recording session.

Allow environment changes before beginning a session or after an explicit reset.

This avoids mixing incompatible harmonic environments, duplicate ambient layers and complicated export automation.

If an environment change during active playback is not supported, clearly communicate that limitation.

Changes to recursion parameters should remain available for future star placements.

Changing recursion parameters must not retroactively change accepted compositions.

Implement one shared ambient harmony layer for the selected environment.

Do not generate a new ambient layer for each accepted root.

---

## Task 12 — Synchronized Playback State Machine

Implement a controller-level playback lifecycle compatible with the existing AudioEngine.

Suggested states:

- idle
- initializing
- playing
- paused
- stopped
- completed
- replaying
- disposed

Avoid unnecessary duplication of internal audio engine state.

The controller may expose transport state separately from recording or replay mode if that produces a clearer design.

### Start session

Create or resume AudioContext from explicit user interaction.

Prepare one shared ambient layer and atmosphere.

Start the audio transport.

Start the visual driver using the authoritative audio playback position.

Do not autoplay on page load.

### Pause

Pause the audio engine.

Freeze the visual scene at the same composition-relative position.

Prevent independent visual progression.

### Resume

Resume the audio engine.

Resume visual rendering against the same transport position.

Do not regenerate the recursive composition.

Do not duplicate scheduled notes or animation loops.

### Stop

Stop all audio sources.

Stop the visual animation driver.

Finalize the active recording using the actual stop position.

Record any interrupted or cancelled notes accurately.

Reset the active transport state.

Preserve the finalized recording for replay or future export.

### Clear or reset

Stop the active session if necessary.

Clear celestial events, pending audio notes and the applicable recording state.

Define whether reset discards the most recent recorded composition.

The demo must communicate destructive recording operations clearly.

### Natural completion

Finalize the recording at the documented session endpoint.

Allow appropriate bounded audio release and effect tails.

Update controller and visual state predictably.

Do not continue indefinite background animation scheduling against a completed transport.

### Dispose

Stop audio and visual engines.

Cancel pending operations.

Remove listeners owned by the controller.

Release stored resources.

Make disposal idempotent.

Do not permit asynchronous initialization to resurrect a disposed session.

Handle rapid Play, Pause, Resume, Stop and Reset operations safely.

---

## Task 13 — Bounded Composition Recorder

Create a clear recording structure.

The controller may keep recording functionality in controller.js or use a separate module such as:

js/composition.js

Use a separate module only if it meaningfully improves clarity.

The recorder must preserve the information required to reproduce the accepted composition without regenerating it from current UI settings.

Record:

- Composition schema version.
- Session identifier.
- Selected musical environment.
- Session duration.
- Actual recorded stop or completion position.
- Original accepted root identifiers.
- Accepted celestial events.
- Root placement positions.
- Relevant validated recursion parameter snapshots.
- Relevant musical configuration snapshots.
- Raw mapped musical note events.
- Actual admitted musical events.
- Suppressed note identifiers and reasons.
- Actual scheduled onset information if it differs from the planned onset.
- Notes cancelled before playback.
- Interrupted note information where applicable.
- Shared ambient harmony instructions.
- Audio configuration snapshot.
- Procedural noise and reverb seed information.
- Relevant mix configuration.
- Documented release and tail behavior.

The record must be serializable using JSON.

Do not store:

- AudioContext objects.
- AudioBuffer instances.
- Oscillator nodes.
- Canvas objects.
- DOM references.
- Timers.
- Animation-frame handles.
- Live function references.

Preserve immutable or safely copied snapshots.

Do not expose mutable internal recorder state directly.

Keep rejected-placement diagnostics separate from accepted musical content.

A rejected placement must not become part of the recorded recursive composition.

---

## Task 14 — Recording Capacity and Session Boundaries

The active recursive event budget is 300, but that does not mean a 60-second composition can contain only 300 historical events over its entire lifetime.

Expired events may release active capacity while remaining in the composition record.

Define an explicit bounded historical recording capacity.

Suggested initial maximum: 300 recorded celestial events per session.

This conservative initial limit keeps the existing music and offline audio batch contracts compatible.

If the existing audio rendering architecture can safely support a larger historical composition without undermining its batch validation and resource bounds, implement a documented bounded alternative.

Do not increase the active recursive event cap above 300.

Do not silently discard older accepted events.

If recording capacity is exhausted:

- Reject further placements.
- Preserve the current recording.
- Report the reason clearly.
- Allow the user to finish the session or explicitly start a new one.

Use a 60-second composition endpoint by default.

Reject a proposed tree when its complete required celestial and musical content cannot fit within the remaining supported session duration.

Do not silently truncate the recursive tree to make it fit.

Account for note releases and the future effect-tail allowance.

Distinguish the composition content endpoint from the additional effect tail.

Document whether user-initiated Stop preserves a shortened composition and how playback interruption is represented.

---

## Task 15 — Audio Settings and Reproduction Policy

Future offline export must reproduce the recorded musical content rather than reconstructing a different composition using current settings.

Choose a clear policy for settings that can change during recording.

For Phase 6, prefer:

- Musical environment locked during recording.
- Recursion parameters editable for future placements.
- Visual theme and accessibility settings handled independently where appropriate.
- Audio synthesis and mix configuration fixed for the recording, except for an explicitly documented monitoring-volume control.

If audible mix settings can change during recording, preserve those changes as bounded composition-time automation events and ensure replay can reproduce them.

Do not claim dynamic mix automation is reproducible if it is not recorded or applied by replay.

If implementing automation would significantly expand the scope, lock the affected controls during recording and explain the restriction.

Clearly distinguish recorded mix gain from a monitoring-only volume control.

Do not silently ignore recorded changes during replay.

Prioritize a reliable, reproducible composition model over unnecessary flexibility.

---

## Task 16 — Deterministic Replay

Implement replay of a finalized recorded composition.

Replay must:

1. Use the recorded celestial event collection.
2. Restore visual events that were previously pruned.
3. Use the recorded admitted musical events.
4. Preserve the recorded musical frequencies, durations, onset times and pan values.
5. Preserve the recorded ambient harmony.
6. Preserve the applicable audio configuration and seeds.
7. Respect recorded cancellations and interruptions.
8. Restart from composition time zero.
9. Maintain the audio-authoritative timeline.
10. Avoid mutating the original recording.

Do not regenerate the recursive tree using current UI settings.

Do not remap the recorded music using a newly selected scale.

Do not accidentally reintroduce notes that were suppressed during the original performance.

Ensure replay's release-aware voice admission does not introduce unexplained differences.

If replay must make a new suppression decision due to unavoidable technical limitations, report the discrepancy instead of claiming identical playback.

Use recorded scheduling decisions and effective timing where available.

A replay can be deterministic in musical content without being sample-identical across different browsers or hardware.

Do not guarantee bit-identical playback.

Disable new star placement during replay unless an explicit new recording session begins.

Provide a clear Replay control in the standalone demo.

---

## Task 17 — Future WAV Export Compatibility

Prepare a stable public method equivalent to:

getCompositionSnapshot()

The snapshot must contain everything the future Phase 7 exporter needs to render the recorded composition using the existing offline synthesis architecture.

Inspect:

renderCompositionOffline(composition, config)

Ensure that the recorded notes, ambient instructions, duration and configuration can be adapted to this existing interface without losing required information.

If necessary, implement a small pure adapter that converts a finalized recording into validated offline-rendering input.

Do not encode WAV files.

Do not generate download links.

Do not create export buttons.

The adapter must:

- Preserve admitted musical content.
- Exclude appropriately suppressed or cancelled notes.
- Preserve relevant effective note timing.
- Preserve supported audio settings and deterministic seeds.
- Respect the documented recording endpoint.
- Handle interrupted note durations and release policy accurately.
- Respect supported offline batch and duration limits.

If exact reproduction of user-initiated stop behavior requires additional envelope or truncation metadata, preserve that metadata now.

Do not silently render a full note that was interrupted in the live recording.

If a particular live behavior cannot be reproduced by the current offline renderer, document the limitation clearly and identify the required Phase 7 work.

An offline compatibility smoke test may render a short finalized recording to an AudioBuffer.

That is preparation for Phase 7, not WAV encoding.

---

## Task 18 — Synchronization Diagnostics

Expose useful integration diagnostics.

Include:

- Current controller state.
- Current audio engine state.
- Current composition-relative playback position.
- Latest visual render time.
- Logical audio-visual timeline difference.
- Number of accepted roots.
- Pending celestial events.
- Active celestial events.
- Remaining shared recursive capacity.
- Recorded celestial event count.
- Recorded musical event count.
- Currently active melodic voices.
- Peak melodic voices.
- Suppressed notes.
- Ambient voice count.
- Atmosphere layer count.
- Composition duration.
- Remaining session duration.
- Recording or replay mode.

When possible, include the scheduled onset and first rendered active-frame time of selected celestial events.

Measure logical scheduling and rendering offsets.

Do not confuse these measurements with end-to-end physical speaker and display latency.

Suggested internal synchronization target:

- Typical foreground visual onset within approximately 50 milliseconds of its scheduled musical timeline onset on the tested environment.

This is a proposed engineering target, not an official hackathon requirement.

Actual results must be measured and reported with their conditions.

Account for browser frame timing, scheduler lookahead and background-tab throttling.

Do not fabricate latency or frame-rate measurements.

Throttle diagnostic DOM updates.

Do not log every animation frame indefinitely.

---

## Task 19 — Error Handling and Resource Cleanup

Handle predictable failures without crashing the integrated application.

Examples:

- Browser lacks Web Audio support.
- AudioContext initialization fails.
- AudioContext cannot resume.
- Canvas initialization fails.
- Invalid root coordinates.
- Invalid recursive parameters.
- Insufficient event capacity.
- Insufficient session time.
- Recording capacity exhausted.
- Duplicate event identifiers.
- Invalid engine state transitions.
- Dynamic audio insertion failure.
- Visual event acceptance failure.
- Unexpected asynchronous operation rejection.

Expose readable error messages.

Preserve the last valid recording where appropriate.

Do not silently continue with audio and visuals in inconsistent states.

When changing or disposing sessions:

- Cancel old scheduler timers.
- Stop old audio sources.
- Remove obsolete graph references.
- Cancel old animation-frame callbacks.
- Clear obsolete queued events.
- Remove controller-owned listeners.
- Release obsolete recording buffers when explicitly discarded.

Use bounded storage.

Handle repeated initialization, start, stop and reset operations safely.

Prevent stale asynchronous callbacks from modifying newer sessions.

---

## Task 20 — Public Controller Interface

Expose a small, documented controller API.

Suggested capabilities:

- DEFAULT_CONTROLLER_CONFIG
- validateControllerConfig
- CosmicEchoesController or createCosmicEchoesController

Suggested controller methods:

- initialize()
- startSession()
- placeStar(x, y)
- pause()
- resume()
- stop()
- reset()
- replay()
- dispose()
- setRecursionConfig(config)
- setEnvironment(id)
- setMonitoringVolume(value)
- setReducedMotion(mode)
- getPlaybackPosition()
- getState()
- getDiagnostics()
- getCompositionSnapshot()
- getOfflineCompositionInput()

These are suggested names, not mandatory replacements for established conventions.

Choose the final method names and signatures after inspecting the actual repository.

Document:

- Arguments.
- Return values.
- Asynchronous behavior.
- Validation rules.
- Rejection reasons.
- State transitions.
- Time units.
- Event ownership.
- Recording semantics.
- Replay behavior.
- Future export compatibility.

Use the smallest interface that supports the required behavior.

---

## Task 21 — Standalone Synchronized Demonstration Page

Create:

tests/sync-demo.html

tests/sync-demo.js

An optional dedicated CSS file may be created if useful.

This is an integrated development demonstration, not the final Phase 8 application interface.

Create an attractive and responsive layout featuring a large cosmic Canvas.

Use the actual centralized controller.

Do not separately wire audio and visuals using unrelated demo-specific logic that bypasses the controller.

### Session controls

Include:

- Start session.
- Pause.
- Resume.
- Stop.
- Replay recording.
- Clear or reset session.

Require an explicit user gesture before audio playback.

Show a visible session state.

Disable controls that are invalid in the current state or provide clear feedback.

### Interactive placement

Allow users to click or tap the Canvas to generate recursive stars and corresponding music.

Also include:

- Normalized X coordinate.
- Normalized Y coordinate.
- Place Star button.
- Place Center Star button.

Use accessible controls.

### Recursion controls

Include:

- Recursion depth.
- Children per star.
- Decay factor.
- Spread angle.
- Base generation delay.
- Tempo.

Use actual recursion defaults and validation.

Changes should affect future accepted trees only.

### Musical environment

Include:

- Deep Space.
- Nebula Dreams.
- Solar Harmony.

Coordinate the visual theme and musical scale.

Clearly indicate when environment changes require starting a new session.

### Audio and visual settings

Include the settings supported by the controller's recording policy.

At minimum:

- Monitoring or master volume.
- Reduced-motion mode.
- Background particle toggle.
- Ripple toggle.
- Constellation connection toggle.

Reverb, atmosphere and ambient mix settings may be available before recording if live automation is not implemented.

Do not provide misleading controls that have no effect.

### Diagnostics

Display:

- Current playback position.
- Remaining session time.
- Pending celestial events.
- Active celestial events.
- Remaining recursive capacity.
- Accepted root count.
- Recorded celestial event count.
- Raw musical note count.
- Admitted or scheduled note count.
- Suppressed note count.
- Active melodic voices.
- Peak melodic voices.
- Recording state.
- Selected environment.
- Relevant synchronization measurements.
- Latest placement result or error.

Use readable labels.

Throttle diagnostic updates.

### Demonstration scenarios

Provide convenient ways to test:

1. One root without descendants.
2. Default binary recursive tree.
3. Maximum ternary recursive tree.
4. Multiple independent root trees.
5. Shared event-capacity rejection.
6. Polyphony suppression.
7. Pause and resume.
8. Recorded composition replay.

All scenarios must use the actual integrated controller.

Do not implement WAV export.

Do not implement final UI polish or optional creative features.

---

## Task 22 — Automated Integration Testing

Create:

tests/sync.test.html

tests/sync.test.js

Follow the existing dependency-free browser testing conventions.

Use native ES modules and asynchronous assertions where necessary.

Run meaningful tests against actual module integration.

Controlled engine substitutes may be used for specific failure-injection and lifecycle scenarios.

Clearly distinguish controlled tests from real Web Audio and Canvas execution.

### Initialization and configuration

Verify:

1. Importing controller.js does not create or start AudioContext.
2. Default controller configuration is valid.
3. Missing optional configuration is handled.
4. Invalid numeric values are handled safely.
5. Invalid Canvas or engine dependencies are rejected appropriately.
6. Caller-owned configuration is not mutated.
7. Initial controller state is nonplaying.
8. Audio and visual modules initialize without unnecessary duplicate resources.

### Shared recursive event mapping

Verify:

9. Depth-zero placement generates the expected single celestial event.
10. Default binary placement generates the expected fifteen events.
11. Maximum ternary placement generates 121 events.
12. The exact generated celestial identifiers are preserved in the musical mapping.
13. Visual and audio paths use the same recursive event collection.
14. Multiple accepted roots receive distinct identifiers.
15. Parent-child musical relationships remain valid.
16. Recursive parameters are captured per accepted tree.
17. Later configuration changes do not mutate previous events.
18. Tempo scaling is not applied twice.

### Live placement

Verify:

19. Live placement uses the current audio-relative timeline.
20. New root onset includes the documented scheduling lead.
21. New notes can enter active playback without restarting transport.
22. New celestial events appear at the corresponding composition times.
23. Live insertion does not recreate ambient harmony.
24. Live insertion does not recreate the atmosphere layer.
25. Live insertion does not reset the audio-context clock.
26. Rapid placements remain bounded.
27. Duplicate event IDs are rejected.
28. Placement during invalid states follows the documented policy.

### Atomic acceptance

Verify:

29. A valid tree is fully accepted by all required components.
30. An invalid tree is rejected without partial insertion.
31. Insufficient recursive capacity causes atomic rejection.
32. Insufficient recording capacity causes atomic rejection.
33. Insufficient remaining duration causes atomic rejection.
34. Simulated audio preparation failure leaves visual and recorder state unchanged.
35. Simulated visual preparation failure leaves audio and recorder state unchanged.
36. Unexpected commit failure follows the documented recovery policy.
37. Rejected placements do not appear in accepted recordings.
38. Rapid concurrent placements cannot overbook shared capacity.

### Event capacity and polyphony

Verify:

39. A tree exactly fitting remaining capacity is accepted.
40. A tree exceeding remaining capacity is rejected.
41. Pending and active recursive occupancy never exceeds 300.
42. Expired events release recursive occupancy.
43. Recorded events remain available after visual pruning.
44. Combined overlapping melodic voices remain within eight.
45. Release tails remain included in voice accounting.
46. Multiple roots share the same melodic voice budget.
47. Suppressed musical notes retain their corresponding visual events.
48. Suppressed note identifiers and reasons are recorded.
49. Ambient voices remain outside the melodic budget.
50. Historical recording and scheduler storage remain bounded.

### Synchronization and transport

Verify:

51. Audio transport is the authoritative time provider.
52. Visual rendering receives the audio-relative position.
53. Celestial onset matches the corresponding musical timeline onset.
54. Pause freezes the audio timeline.
55. Pause freezes visual event progression.
56. Resume continues from the same position.
57. Stop clears active playback resources.
58. Stop finalizes the appropriate recording.
59. Reset follows the documented recording-clearing policy.
60. Natural completion finalizes the session.
61. Repeated play or resume commands do not duplicate schedulers.
62. Repeated visual start commands do not duplicate animation loops.
63. Large frame delays do not create independent timeline drift.
64. Stale asynchronous operations cannot revive stopped sessions.

### Recording and replay

Verify:

65. Accepted trees are stored in the recording.
66. Rejected trees are excluded.
67. Recorded root configurations remain unchanged.
68. Actual admitted and suppressed notes are distinguishable.
69. Recording snapshots are JSON-serializable.
70. External mutation of a snapshot cannot mutate the original recording.
71. Recorded ambient instructions remain available.
72. Recorded audio configuration and seeds remain available.
73. Replay restores pruned celestial events.
74. Replay uses the original recorded musical notes.
75. Replay preserves the original accepted note onsets.
76. Replay does not regenerate events from current UI settings.
77. Replay excludes originally suppressed or cancelled notes.
78. Replay handles recorded stop and interruption semantics.
79. Replay does not mutate the saved composition.
80. Replay remains subject to the documented resource limits.

### Future offline export compatibility

Verify:

81. A finalized recording can produce valid offline composition input.
82. The offline adapter preserves recorded musical identity and timing.
83. Suppressed notes are not accidentally reintroduced.
84. The recording respects supported offline duration and batch limits.
85. A short recorded composition can render to a finite stereo AudioBuffer.
86. No WAV encoder or audio-download workflow is introduced.

### Integrated demo and cleanup

Verify:

87. The synchronized demo loads successfully.
88. Audio does not autoplay.
89. An actual recursive scenario can be generated.
90. Actual Web Audio and Canvas modules can operate together under the supported test conditions.
91. Pointer coordinate placement uses the correct normalized position.
92. Keyboard placement invokes the same controller workflow.
93. Reduced-motion changes preserve musical event timing.
94. Environment selection coordinates the correct scale and visual theme.
95. Disposal stops scheduler and visual animation resources.
96. Repeated disposal is safe.
97. Existing recursion, music, audio and visual public contracts remain intact.
98. Previously implemented standalone demos remain functional.

These are required verification scenarios, not a requirement to create exactly 98 individual test rows.

Group related assertions into focused test cases where appropriate.

Do not spend unnecessary time manufacturing test counts.

Prioritize actual integration, failure handling, timing correctness and reproducible recording behavior.

Report skipped or unsupported checks honestly.

---

## Task 23 — Manual Integrated Verification

Add a Phase 6 manual verification checklist to docs/TESTING.md.

Include:

### Basic integrated experience

1. The demo loads without autoplay.
2. Start Session initializes normal browser audio successfully.
3. Clicking the Canvas creates a visible root and corresponding audible note.
4. Recursive child visuals emerge alongside their musical responses.
5. The visual and musical progressions appear synchronized.
6. Multiple independent roots can coexist.
7. New stars can be placed while music is playing.
8. Adding a new root does not restart existing music.
9. Ambient harmony remains continuous between placements.
10. Musical environment and visual theme remain consistent.

### Playback and timing

11. Pause freezes both sound and celestial animation.
12. Resume continues both from the same timeline.
13. Stop silences audio and stops active celestial animation.
14. Replay begins from the recorded composition start.
15. Replay reproduces the recorded celestial structure.
16. Replay reproduces the original musical progression.
17. Changing recursion parameters affects only future placements.
18. Natural completion behaves predictably.

### Capacity and stability

19. Near-capacity scenes remain usable.
20. Excessive placement is rejected with visible feedback.
21. Active melodic voices remain within eight.
22. Suppressed notes do not remove their corresponding celestial events.
23. Rapid clicks do not cause unexpected duplicate trees.
24. Rapid transport actions do not create duplicate playback.
25. Repeated reset and replay operations remain stable.

### Accessibility and user experience

26. Keyboard star placement works.
27. Reduced-motion mode remains usable.
28. Volume control behaves according to the documented recording policy.
29. Controls and status messages remain readable.
30. The combined experience feels calm and coherent.

Record optional measured logical synchronization offsets and frame-rate diagnostics under a representative workload.

Do not claim physical audio-display synchronization measurements without appropriate measurement methods.

Do not mark manual checks as passed unless actually performed by the developer.

---

## Task 24 — Regression Verification

Execute the existing browser test suites:

- tests/recursion.test.html
- tests/music.test.html
- tests/audio.test.html
- tests/visuals.test.html

Execute the new integration suite:

- tests/sync.test.html

Use the existing local static HTTP and headless Microsoft Edge workflow.

Use the actual existing test conventions.

Perform a smoke check of:

tests/sync-demo.html

Verify:

- The page loads without unexpected JavaScript errors.
- The controller initializes correctly.
- Audio does not autoplay on ordinary page load.
- A representative integrated scenario can be generated.
- The visual renderer accepts actual recursive event data.
- The audio engine accepts actual mapped musical event data.
- The recording snapshot is valid.
- Diagnostics update appropriately.

If testing live audio requires a headless autoplay override or muted output, disclose that fact.

Do not treat headless muted playback as proof of normal audible browser behavior.

Wait for all asynchronous test cases to complete.

Do not report a partial summary as the final result.

Run git diff --check.

Inspect the Git diff for unintended modifications.

Do not weaken existing tests to make the integration pass.

Report the actual number of passing, failing and skipped tests separately for each suite.

---

## Task 25 — Documentation

Update relevant project documentation:

- README.md
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/PROJECT_PLAN.md
- docs/PROGRESS_LOG.md
- docs/TESTING.md

Document:

1. Central controller architecture.
2. Actual public controller API.
3. Shared audio-authoritative timeline.
4. Live placement workflow.
5. Atomic acceptance strategy.
6. Shared recursive event capacity.
7. Dynamic audio insertion implementation.
8. Release-aware polyphony behavior.
9. Musical suppression policy.
10. Playback lifecycle.
11. Environment coordination.
12. Recording data structure.
13. Recording capacity and duration policy.
14. Session stop and interruption semantics.
15. Audio settings reproducibility policy.
16. Deterministic replay behavior.
17. Future offline export compatibility.
18. Error recovery strategy.
19. Resource cleanup.
20. Actual automated test results.
21. Manual verification instructions.
22. Known limitations.
23. Remaining responsibilities for Phases 7 and 8.

Document every necessary change to an existing engine.

Explain why each change was required for integration.

Distinguish:

- Standalone engine verification.
- Integrated automated verification.
- Normal browser manual verification.
- Logical synchronization measurements.
- Subjective relaxation and user experience assessment.

Do not mark Phase 6 fully verified if required manual integration checks remain outstanding.

Use an accurate status such as implementation complete with manual integrated verification pending.

Preserve all previous AI records.

Do not fabricate missing transcripts.

Report existing archive compliance issues separately.

The developer will archive the complete original prompt and response.

---

## Implementation Priorities

This is a time-constrained hackathon project.

Prioritize these mandatory Phase 6 outcomes:

1. Working synchronized audio and visuals.
2. Live star placement without playback restart.
3. Centralized capacity and release-aware polyphony.
4. Reliable play, pause, resume and stop.
5. Bounded recording and deterministic replay.
6. Future offline rendering compatibility.
7. Meaningful integration tests.
8. Clear documentation.

Do not prioritize optional abstractions, advanced settings automation, complex preset crossfades or decorative features over these outcomes.

If an optional feature threatens the stability or completion of the core implementation, omit it and document the limitation.

---

## Constraints

- Vanilla JavaScript, HTML and CSS only.
- Native ES modules.
- Canvas 2D.
- Web Audio API.
- Existing recursion and musical mapping algorithms.
- No external runtime dependencies.
- No npm packages.
- No frameworks.
- No build step.
- No backend.
- No paid APIs.
- No external audio files.
- No external images.
- No duplicate recursive generator.
- No duplicate musical mapper.
- No independent authoritative visual clock.
- No unnecessary audio synthesis changes.
- No unnecessary visual redesign.
- No WAV encoder.
- No audio download functionality.
- No complete final application interface.
- Avoid unnecessary modifications to index.html, style.css and app.js.
- Preserve all existing uncommitted work.
- Preserve existing module contracts wherever possible.
- Do not fabricate test results.
- Do not fabricate synchronization measurements.
- Do not fabricate AI transcripts.
- Do not create Git commits.
- Do not push to GitHub.
- Do not begin Phase 7.

---

## Final Report

After implementation, return a structured report containing:

1. Files created.
2. Files modified.
3. Existing engine compatibility findings.
4. Central controller architecture.
5. Actual public controller API and signatures.
6. Shared timeline and scheduling strategy.
7. Dynamic star placement behavior.
8. Atomic placement acceptance and recovery.
9. Shared event capacity enforcement.
10. Dynamic audio scheduler modifications.
11. Release-aware runtime polyphony.
12. Suppressed musical note handling.
13. Playback state machine.
14. Musical environment coordination.
15. Composition recorder data structure.
16. Recording capacity and session limits.
17. Deterministic replay behavior.
18. Stop and interrupted-note recording policy.
19. Audio settings reproducibility policy.
20. Offline rendering compatibility.
21. Necessary modifications to existing modules.
22. Recursion regression results.
23. Musical mapping regression results.
24. Procedural audio regression results.
25. Visual engine regression results.
26. New integration test results.
27. Synchronized demo smoke-check results.
28. Actual measured synchronization results, if available.
29. Manual integrated checks still outstanding.
30. Git diff verification.
31. Exact instructions for opening the synchronized demo.
32. Known limitations and archive issues.
33. Phase 6 readiness status.
34. Remaining responsibilities for Phase 7.

Keep the report understandable to a JavaScript beginner.

Implement Phase 6 now.

Do not begin Phase 7.

## Agent Response

**Phase 6 is implemented in the synchronized development demo. All 147 automated tests passed. Normal-browser listening and perceived synchronization still need manual verification. Phase 7 has not started.**

### What changed

- **Created** [js/controller.js](/E:/Projects/cosmic-echoes/js/controller.js), `tests/sync-demo.html`, `tests/sync-demo.js`, `tests/sync.test.html`, and `tests/sync.test.js`.
- **Modified** `js/audio.js` for live note insertion, scheduling records, and replay endpoints, and `js/visuals.js` for accepting validated future events without drawing during placement. Updated `README.md`, `AGENTS.md`, and the architecture, project plan, progress log, and testing docs. Recursion, musical mapping, synthesis settings, and the main app files were preserved.

The controller uses `AudioEngine.getPlaybackPosition()` as the shared clock. Animation frames draw the latest position. Live placement defaults to a **160 ms lead**, stages musical notes in the existing audio queue, and commits the matching visual tree and recording together. If the renderer rejects a tree, the unscheduled audio batch is rolled back. Placement leaves the audio graph and ambient layers running.

The controller enforces **300 pending plus active celestial events** and a separate recording cap of **300 historical events**. Audio continues to enforce **eight melodic voices including releases**. Notes suppressed by the audio scheduler retain their corresponding visual events and are identified in the recording.

Replay restores the original celestial events and uses the admitted notes at their effective onsets, with the recorded environment, mix, and seeds. Stops record cancellations and interruptions. Early-stopped recordings cut playback and offline rendering at the recorded endpoint. Naturally completed recordings keep the bounded audio tail. Monitoring volume affects listening only. The offline adapter returns input for stereo rendering, with WAV encoding reserved for Phase 7.

The public interface starts with `new CosmicEchoesController(canvas, config)` and exposes `initialize()`, `startSession()`, `placeStar(x, y)`, `pause()`, `resume()`, `stop()`, `reset()`, `replay()`, and `dispose()`. It also exposes settings, diagnostics, `getCompositionSnapshot()`, and `getOfflineCompositionInput()`. [Full API](/E:/Projects/cosmic-echoes/docs/ARCHITECTURE.md#synchronized-controller)

### Verification

| Headless Edge suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Procedural audio | 23 | 0 | 0 |
| Visual engine | 15 | 0 | 0 |
| Synchronized integration | 8 | 0 | 0 |
| **Total** | **147** | **0** | **0** |

The integrated smoke check confirmed no audio context on load, successful placement and scheduling of the 15-event binary scenario, and cleared live occupancy on stop. Both standalone demos also loaded. One muted headless sample showed an **18.7 ms logical render gap** between the sampled audio clock and the latest visual frame. Physical audio-to-display latency remains unmeasured.

`git diff --check` passed. Existing AI records were preserved. Older archive gaps remain, including the empty `020` file labeled Archived. Nothing was committed or pushed.

### Open the demo

From the project root, run `python -m http.server 8000 --bind 127.0.0.1`. Open `http://127.0.0.1:8000/tests/sync-demo.html`, choose **Start session**, place stars, then **Stop** and **Replay recording**. Use the [manual integrated checklist](/E:/Projects/cosmic-echoes/docs/TESTING.md#phase-6-manual-integrated-verification) to verify audible synchronization, controls, and the combined experience in a normal browser.
