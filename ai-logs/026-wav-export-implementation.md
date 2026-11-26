# AI Interaction - 026

## User Prompt

Original submitted task attachment (Pasted text.txt).

# Cosmic Echoes — Phase 7 Implementation

## Role

Act as a senior JavaScript engineer, Web Audio API specialist, digital audio engineer and browser application developer.

You are implementing Cosmic Echoes, a browser-based recursive procedural music application for the Hub's Quest Epoch 1 solo hackathon.

The developer is a JavaScript beginner. Keep the implementation modular, understandable, reliable, maintainable and easy to demonstrate.

Working audio export is a mandatory hackathon deliverable.

Prioritize correct audio-file generation, recorded composition fidelity, resource safety and reliable browser downloads over optional export features.

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
- js/controller.js
- All existing automated test modules.
- tests/sync-demo.html
- tests/sync-demo.js

Inspect the actual existing public interfaces, recording schema, offline rendering contract, audio configuration, early-stop behavior and release-tail policy.

Previously reported automated verification:

- Recursion: 32/32 passed.
- Musical mapping: 69/69 passed.
- Procedural audio: 23/23 passed.
- Visual engine: 15/15 passed.
- Synchronization: 8/8 passed.
- Total: 147 passed, 0 failed, 0 skipped.

Previously reported manual verification:

- Audio: 20/20 passed.
- Visuals: 29/29 passed.
- Synchronization: 28/28 passed.
- Total: 77 manual checks passed.

During Phase 6 closure, an additional offline rendering check reportedly verified:

- A completed two-second recording.
- Stereo output.
- Sample rate of 44100 Hz.
- 119071 rendered frames.
- Approximately 0.7 seconds of additional tail.
- Finite, non-silent audio samples.
- Eight admitted melodic events included.
- Four suppressed musical event IDs excluded.

The earlier integration suite also reportedly verified early-stop hard-cut behavior.

These are existing reported results. Do not describe them as newly executed tests.

The existing controller reportedly exposes:

- getCompositionSnapshot()
- getOfflineCompositionInput()

The offline input method returns:

{ composition, config }

Or null if there is no finalized positive-duration recording.

The existing audio module reportedly exports:

renderCompositionOffline(composition, config)

Inspect the actual source before relying on these contracts.

Check the current Git working tree.

Preserve existing uncommitted work.

Report outstanding AI archive issues honestly.

The developer explicitly authorizes Phase 7 implementation.

## Scope

Implement Phase 7 only: WAV Export System.

Create a standalone audio export module that converts a finalized recorded composition into a valid stereo 16-bit PCM WAV file.

Create a standalone interactive export demonstration page using the actual existing integrated controller.

Do not implement Phase 8.

Do not implement the final application interface, optional creative features, cloud storage, additional audio formats or unrelated redesigns.

---

## Task 1 — Export Module Architecture

Create:

js/export.js

Use native JavaScript ES module exports.

Separate the implementation into clear responsibilities:

1. Export configuration and validation.
2. Finalized composition validation.
3. Offline audio rendering.
4. AudioBuffer validation.
5. Floating-point to PCM conversion.
6. Stereo sample interleaving.
7. RIFF/WAVE header construction.
8. WAV binary encoding.
9. Blob creation.
10. Safe filename generation.
11. Browser download initiation.
12. Export lifecycle management.
13. Resource cleanup.
14. Error handling.

Prefer small pure functions for binary encoding and validation.

Use a small export coordinator class or factory only if it meaningfully improves lifecycle management.

Do not access DOM elements automatically on module import.

Do not create an AudioContext or initiate audio playback on module import.

Do not initiate downloads automatically.

Keep binary encoding independent of the DOM.

Keep the export module reusable by the future final application interface.

---

## Task 2 — Existing Composition Compatibility

Use the existing centralized controller as the source of recorded composition data.

Inspect and integrate with:

controller.getCompositionSnapshot()

controller.getOfflineCompositionInput()

The export workflow must consume a detached snapshot of a finalized composition.

Do not generate new celestial trees.

Do not remap musical pitches.

Do not recreate the recording using the current recursion settings.

Do not export the raw musical event collection if it contains events that were suppressed during actual playback.

Preserve:

- Accepted celestial event identity.
- Admitted musical events.
- Actual effective scheduling times.
- MIDI notes and frequencies.
- Musical durations.
- Stereo pan values.
- Recorded instrument identifiers.
- Recorded intensity.
- Ambient harmony instructions.
- Procedural atmosphere settings.
- Reverb configuration and seed.
- Recorded audio configuration.
- Recorded endpoint.
- Release and tail policy.
- Cancellation and interruption decisions.

The WAV file must represent the recorded musical composition rather than an unrelated new rendering.

Do not mutate controller-owned data.

Capture the export input once at export initiation.

Subsequent controller resets or configuration changes must not silently alter an export already in progress.

If a recording is invalidated or discarded during export, follow a clearly documented snapshot policy.

---

## Task 3 — Export Eligibility

Define a predictable export eligibility policy.

Allow export when:

- A finalized recording exists.
- Its duration is positive and finite.
- The existing controller can provide valid offline composition input.
- The recording satisfies the supported composition and resource limits.
- Another conflicting export is not in progress.

Do not silently finalize or stop an active recording merely because the user requests export.

For Phase 7, require the user to stop or naturally complete the recording before exporting.

Return a clear message when:

- No finalized recording exists.
- The recording is still active.
- The recording has zero duration.
- The offline composition input is invalid.
- The recording exceeds supported limits.
- An export is already running.
- The browser lacks required capabilities.

A valid intentionally silent or ambient-only recording should not be rejected solely because it contains no audible melodic notes.

Follow the actual controller's finalized-recording contract.

Do not invent a recording when none exists.

---

## Task 4 — Offline Audio Rendering

Reuse the existing function:

renderCompositionOffline(composition, config)

Inspect its actual signature and return behavior.

The exporter must not implement a second audio synthesis engine.

Use the existing:

- Starlight instrument.
- Echo instrument.
- Nebula-pad instrument.
- Procedural noise layer.
- Procedural reverb.
- Gain staging.
- Release-aware voice admission.
- Deterministic seed handling.

Requirements:

1. Render a valid finalized recording offline.
2. Use the recorded audio configuration.
3. Preserve the existing release-aware voice policy.
4. Preserve the admitted musical event collection.
5. Exclude suppressed or cancelled notes according to the recorded decisions.
6. Use stereo output.
7. Use a default export sample rate of 44100 Hz.
8. Respect the maximum supported composition duration.
9. Respect the existing additional-tail policy.
10. Return or consume the actual AudioBuffer produced by the renderer.

Do not start live playback to create the exported audio.

Do not record microphone input.

Do not use MediaRecorder as the primary export method.

Do not capture system audio.

Do not introduce servers or external audio services.

Do not modify the approved synthesis settings merely to make export easier.

If the offline renderer requires a sample-rate override for WAV export, apply it through the documented configuration interface.

Avoid changing the original recorded configuration object.

---

## Task 5 — Early Stop and Natural Completion

Preserve the existing recording semantics.

### Early-stop recording

The existing controller reportedly implements a hard cut at the recorded endpoint when a user stops the session early.

The exported WAV must follow that same policy.

Requirements:

- Preserve the actual recorded endpoint.
- Do not render notes that were cancelled before their onset.
- Do not extend interrupted notes beyond the recorded endpoint.
- Apply the same documented hard-cut behavior to melody, ambient harmony, atmosphere and effects.
- Do not add an unrelated reverb tail after an early-stop boundary if the recorded policy prohibits it.

Do not silently convert an early-stop recording into a naturally completed composition.

If the actual existing hard-cut implementation requires a specific offline input field, preserve it.

### Naturally completed recording

Preserve the existing bounded instrument release and reverb-tail behavior.

Requirements:

- Include the actual composition content.
- Preserve the required release and effect tail.
- Respect the maximum additional tail of four seconds.
- Do not truncate valid tails unnecessarily.
- Do not append an arbitrary fixed four-second silent segment if the existing renderer calculates a shorter tail.

Use the actual returned AudioBuffer length as the source of truth for the exported WAV frame count.

Do not estimate the final audio duration independently and then write an inconsistent WAV header.

Document the difference between early-stop and natural-completion exports.

---

## Task 6 — Supported WAV Format

Implement standard uncompressed stereo 16-bit PCM WAV output.

Required format:

- Container: RIFF.
- Format identifier: WAVE.
- Format chunk: fmt followed by one space.
- Audio format code: 1, linear PCM.
- Number of channels: 2.
- Sample rate: 44100 Hz for standard composition export.
- Bits per sample: 16.
- Block alignment: 4 bytes.
- Byte rate: 176400 bytes per second at 44100 Hz.
- Audio data chunk identifier: data.
- Sample data: signed 16-bit integers.
- Byte order: little-endian.
- Stereo arrangement: left sample, right sample, repeated for every frame.

Use a standard 44-byte PCM header without unnecessary metadata chunks.

Do not implement MP3, AAC, FLAC, floating-point WAV or compressed WAV.

Do not add format selectors that suggest unsupported functionality.

The pure encoder may support other valid sample rates for independent unit testing, provided the standard application export remains 44100 Hz.

If supporting other sample rates in the pure encoder, write the actual sample rate and calculated byte rate into the header.

Do not label non-44100 Hz audio as 44100 Hz without actual resampling.

---

## Task 7 — RIFF/WAVE Header Construction

Use ArrayBuffer and DataView or an equivalent native binary representation.

Write all numeric fields in little-endian format.

Construct the following standard PCM WAV header:

Offset 0, length 4:
ASCII RIFF.

Offset 4, length 4:
Unsigned 32-bit RIFF chunk size.
Value = total file size minus 8.

Offset 8, length 4:
ASCII WAVE.

Offset 12, length 4:
ASCII fmt followed by one space.

Offset 16, length 4:
Unsigned 32-bit format chunk size.
Value = 16.

Offset 20, length 2:
Unsigned 16-bit audio format.
Value = 1.

Offset 22, length 2:
Unsigned 16-bit channel count.
Value = 2.

Offset 24, length 4:
Unsigned 32-bit sample rate.

Offset 28, length 4:
Unsigned 32-bit byte rate.
Value = sample rate × channel count × bytes per sample.

Offset 32, length 2:
Unsigned 16-bit block alignment.
Value = channel count × bytes per sample.

Offset 34, length 2:
Unsigned 16-bit bits per sample.
Value = 16.

Offset 36, length 4:
ASCII data.

Offset 40, length 4:
Unsigned 32-bit PCM data size.

Offset 44 onward:
Interleaved signed 16-bit PCM samples.

Calculate:

bytesPerSample = 2

blockAlign = channelCount × bytesPerSample

dataSize = frameCount × blockAlign

fileSize = 44 + dataSize

riffChunkSize = fileSize - 8

Validate that all calculated sizes are finite, safe integers and within supported RIFF limits.

Check that the allocated ArrayBuffer length exactly matches the required file size.

Do not leave uninitialized padding between the header and audio data.

Do not insert extra bytes that contradict the chunk sizes.

---

## Task 8 — Floating-Point Sample Conversion

Web Audio AudioBuffer channels contain floating-point samples.

Convert each sample to signed 16-bit PCM.

Implement a small pure conversion helper.

Required behavior:

1. Validate or safely handle non-finite samples.
2. Clamp finite sample values to the interval from -1 to +1.
3. Map negative values using the signed negative range of 32768.
4. Map positive values using the signed positive range of 32767.
5. Use a documented deterministic rounding method.
6. Preserve zero as zero.

Expected endpoint conversions:

- -1 maps to -32768.
- 0 maps to 0.
- +1 maps to +32767.
- Values below -1 clamp to -32768.
- Values above +1 clamp to +32767.

Choose and document a consistent rounding rule for fractional values.

Do not allow signed integer overflow or wraparound.

Prefer rejecting an AudioBuffer containing non-finite samples during high-level export, since NaN and Infinity indicate a rendering defect.

The low-level sample helper may safely return zero for non-finite values if that behavior is documented and tested.

Do not silently hide a large number of invalid samples in a successful export.

Report invalid or clipped sample counts where useful.

Do not normalize the entire composition automatically.

Do not add uncontrolled gain.

Do not add nondeterministic dithering.

The existing audio engine already owns synthesis and gain staging.

The encoder should preserve that output as closely as possible within 16-bit PCM quantization.

---

## Task 9 — Stereo Interleaving

Read the actual left and right AudioBuffer channels.

Write samples in this order:

Frame 0 left.
Frame 0 right.
Frame 1 left.
Frame 1 right.
Frame 2 left.
Frame 2 right.

Continue until every frame is encoded.

Use little-endian signed 16-bit writes.

Ensure:

- No left/right channel swapping.
- No planar channel layout in the WAV data chunk.
- No dropped final frame.
- No duplicated frame.
- No mismatched frame count.
- No incorrect sample offset.

Validate that both channel arrays have the expected length.

Do not create unnecessary large temporary arrays merely to interleave channels.

Prefer writing directly into the allocated WAV ArrayBuffer.

Keep the encoder memory usage bounded.

The WAV file size must be consistent with the actual AudioBuffer length.

---

## Task 10 — AudioBuffer Validation and Resource Limits

Validate the renderer output before allocating the WAV buffer.

Check:

- A valid AudioBuffer or explicitly supported equivalent.
- Exactly two channels for the standard stereo exporter.
- Positive integer frame count.
- Supported positive integer sample rate.
- Finite duration.
- Channel arrays of matching length.
- Supported maximum composition and tail duration.
- Safe calculated binary file size.

Standard maximum duration:

- Up to 60 seconds of recorded composition.
- Up to four additional seconds of supported tail.

At 44100 Hz, stereo, 16-bit PCM, a 64-second file requires approximately 10.77 MiB of WAV storage.

Allow for the existing floating-point AudioBuffer and temporary browser allocations.

Do not allocate arbitrarily large arrays.

Do not permit malformed metadata to cause excessive memory allocation.

Do not assume a caller-supplied duration is consistent with the actual frame count.

Use the actual audio frame count when validating and constructing the output.

Handle allocation failures with clear errors.

Avoid retaining both the AudioBuffer and WAV data in long-lived application state after export unless needed for an explicitly supported preview.

---

## Task 11 — WAV Metadata and Blob Creation

Return a useful export result.

Suggested metadata:

- Filename.
- MIME type.
- Sample rate.
- Channel count.
- Bits per sample.
- Frame count.
- Audio duration.
- Data byte count.
- Total WAV byte count.
- Clipped sample count.
- Invalid sample count, if applicable.

Construct a Blob with MIME type:

audio/wav

The Blob must contain the exact encoded WAV bytes.

Do not serialize binary data as JSON.

Do not base64-encode the entire audio file unnecessarily.

Do not place large exported audio data in localStorage.

Do not upload exported compositions anywhere.

Choose a simple result structure that the future final application interface can consume.

Document ownership and cleanup expectations for returned resources.

---

## Task 12 — Safe Filename Generation

Generate readable filenames for exported compositions.

Suggested examples:

cosmic-echoes-deep-space-2026-11-26-140530.wav

cosmic-echoes-nebula-dreams-001.wav

Use the recorded environment or a generic composition identifier.

Requirements:

- Always use the .wav extension.
- Sanitize user-provided filename components.
- Remove or replace unsupported filesystem characters.
- Prevent path traversal components.
- Avoid control characters.
- Avoid excessively long filenames.
- Provide a safe fallback name.
- Avoid including private information unnecessarily.

Use local date/time or a session identifier only for filename generation where appropriate.

Do not introduce nondeterministic values into the musical rendering itself.

Do not claim that filename generation affects composition determinism.

Allow an optional safe filename override if useful.

Keep filename handling separate from binary encoding.

---

## Task 13 — Browser Download

Implement a browser-compatible WAV download helper.

Use native browser capabilities:

- Blob.
- URL.createObjectURL.
- An anchor element with the download attribute.
- A real user-triggered download workflow.

A valid implementation may:

1. Generate the WAV Blob asynchronously.
2. Store a bounded ready-to-download result.
3. Create an object URL.
4. Provide a Download WAV button.
5. Initiate the actual download when the user activates that button.
6. Release the object URL when no longer needed.

Do not depend on a delayed synthetic click retaining the original user activation in every browser.

Prefer an explicit second download action after rendering if that is more reliable.

Do not claim a download completed merely because an anchor click was initiated.

Use accurate feedback such as:

- WAV ready.
- Download requested.
- Export failed.

Avoid automatically opening new tabs.

Do not require browser extensions.

Do not use external file-hosting services.

Ensure download controls remain keyboard accessible.

If an in-page audio preview uses the same Blob URL, keep it alive until that preview is replaced or disposed.

Do not revoke a URL before the browser has had a reasonable opportunity to consume it.

Document browser-specific download limitations.

---

## Task 14 — Export State Management

Implement a predictable export lifecycle.

Suggested states:

- idle
- validating
- rendering
- encoding
- ready
- error
- cancelled
- disposed

Use a smaller state model if it is equally understandable.

Requirements:

- Allow only one active export operation per exporter.
- Prevent repeated clicks from launching duplicate offline renders.
- Expose the current state.
- Expose a useful status message.
- Return readable errors.
- Preserve the captured composition input during asynchronous rendering.
- Do not overwrite a ready result unexpectedly.
- Clearly define how a new export replaces an older result.
- Release old resources when replacement occurs.
- Prevent stale asynchronous results from updating a newer export operation.
- Make disposal safe to call more than once.

Do not promise precise rendering progress percentages if OfflineAudioContext cannot expose meaningful progress.

Prefer stage-based feedback:

Preparing composition.
Rendering audio.
Encoding WAV.
Ready to download.

Allow the browser to display status updates before starting potentially expensive processing.

Do not add artificial delays merely to animate a progress bar.

---

## Task 15 — Cancellation and Disposal

Inspect the actual offline rendering API.

Do not claim that OfflineAudioContext rendering can always be immediately aborted.

If reliable mid-render cancellation is unavailable, implement logical cancellation.

Logical cancellation should:

- Mark the operation as cancelled.
- Prevent a cancelled result from being published.
- Prevent an automatic download after cancellation.
- Discard the completed render when it eventually resolves.
- Release its associated resources.
- Keep operation ownership and concurrency accounting consistent.

Avoid starting multiple large offline rendering operations while an earlier cancelled operation is still consuming resources.

If necessary, keep the exporter busy until the underlying render settles.

Document that logical cancellation may not immediately stop browser-side processing.

When disposing an exporter:

- Revoke owned object URLs when safe.
- Clear references to obsolete AudioBuffers.
- Clear references to obsolete WAV results.
- Cancel or invalidate pending result handlers.
- Remove exporter-owned listeners.
- Prevent subsequent state resurrection.

Do not close or dispose the existing live audio engine merely to release offline export resources.

Do not mutate the recorded composition during cleanup.

---

## Task 16 — Recorded Composition Fidelity

The exporter must use the actual accepted recording.

Do not export notes that were suppressed by the original live voice-admission policy.

Do not introduce cancelled musical notes.

Do not regenerate musical mappings from the current scale.

Do not change frequencies or panning.

Do not apply tempo scaling again.

Do not add another ambient harmony layer.

Do not render a different atmosphere seed.

Do not apply current UI settings retroactively.

Use the existing snapshot and offline adapter.

Preserve the documented difference between monitoring volume and recorded mix.

Phase 6 reportedly excludes monitoring volume and live mix automation from recorded content.

Verify the actual policy.

If monitoring volume is intentionally excluded, do not silently include it in the exported composition.

The demo should communicate that exported audio uses the recorded mix rather than necessarily matching the current monitoring-volume slider.

Offline audio may differ slightly from live audio due to device sample rate, browser implementation and real-time scheduling behavior.

Do not guarantee bit-identical live and offline waveforms.

Target faithful recorded musical content under the documented synthesis and rendering policy.

---

## Task 17 — Public Export API

Expose a small, understandable public interface.

Suggested exports:

- WAV_EXPORT_DEFAULTS
- floatToPcm16(sample)
- validateAudioBuffer(buffer)
- encodeWavPCM16(buffer)
- createWavBlob(buffer)
- createExportFilename(metadata)
- renderRecordingToWav(offlineInput, options)
- downloadWav(blob, filename)
- WavExporter or createWavExporter

These names are suggestions rather than mandatory replacements for established project conventions.

Choose final signatures after inspecting the actual architecture.

Document:

- Function arguments.
- Return types.
- Binary output format.
- Supported sample rates.
- Channel requirements.
- Duration and size limits.
- Error behavior.
- Asynchronous operations.
- Resource ownership.
- Cancellation semantics.
- Download initiation.
- Integration with the existing controller.

Do not unnecessarily export private implementation details.

Keep the pure WAV encoder directly testable without the browser download workflow.

---

## Task 18 — Controller Integration

Use the existing controller API wherever possible.

The preferred integration is:

1. Obtain finalized offline composition input from the controller.
2. Pass the detached input to the exporter.
3. Render through the existing audio module.
4. Encode the returned AudioBuffer.
5. Prepare a WAV download.

Do not couple the controller to DOM-specific download buttons.

Do not add a second composition recorder.

Do not add unnecessary export-specific responsibilities to the existing audio or visual modules.

If a minimal controller or audio-module compatibility fix is necessary:

- Explain the actual defect.
- Make the smallest backward-compatible change.
- Preserve existing interfaces.
- Rerun affected regression suites.
- Document the change.

Preserve all four foundational engines and the synchronized controller wherever possible.

---

## Task 19 — Standalone Export Demonstration Page

Create:

tests/export-demo.html

tests/export-demo.js

An optional dedicated CSS file may be created if useful.

This is a development demonstration, not the final Phase 8 application interface.

Use the actual centralized controller and existing visual and audio engines.

Avoid duplicating the integration logic from controller.js.

### Recording controls

Include:

- Start session.
- Pause.
- Resume.
- Stop.
- Replay.
- Reset or clear recording.

Provide interactive Canvas star placement.

Provide a keyboard-accessible center-star placement method.

Include a small selection of recursion settings sufficient to produce representative recordings.

Use actual existing configuration validation.

### Export controls

Include:

- Export WAV or Prepare WAV button.
- Download WAV button when an export result is ready.
- Cancel export where supported by the documented logical cancellation policy.
- Clear prepared export, if useful.

Clearly explain that the recording must be finalized before export.

Disable or appropriately handle invalid actions.

### Export status

Display:

- Whether a finalized recording exists.
- Recorded duration.
- Number of recorded celestial events.
- Number of admitted musical notes.
- Number of suppressed notes.
- Current export stage.
- Export filename.
- WAV file size.
- Sample rate.
- Channel count.
- Bit depth.
- Final rendered duration.
- Export errors.

Use actual result metadata.

Do not display estimated file metadata as verified output.

### Optional preview

A native HTML audio element may be used to preview the generated WAV Blob.

Do not autoplay the preview.

Do not accidentally play the preview and live composition simultaneously without clear user control.

Release previous preview object URLs safely when replacing them.

Keep the preview implementation small.

The actual download is mandatory. In-page preview is optional.

### Demonstration scenarios

Provide practical ways to test:

1. Short recording with a single root.
2. Default binary recursive composition.
3. Multiple independent root trees.
4. Recording stopped early.
5. Naturally completed short session.
6. Recording with suppressed musical notes.
7. Ambient-only or deliberately silent recording if supported.

Reuse existing controller behavior.

Allow a shorter demonstration session duration where the controller already supports it, so natural-completion tests do not always require waiting 60 seconds.

Do not introduce conflicting production duration rules.

Do not create unrelated hardcoded audio as the primary export demonstration.

---

## Task 20 — Automated Binary-Format Testing

Create:

tests/export.test.html

tests/export.test.js

Follow the existing dependency-free browser testing conventions.

Use native JavaScript ES modules.

Support asynchronous tests.

Use small deterministic synthetic AudioBuffers or explicitly supported buffer fixtures for focused binary tests.

Use actual controller recordings and OfflineAudioContext for integration tests.

Do not install npm packages or external test frameworks.

Display individual PASS or FAIL results and a clear overall summary.

### PCM conversion

Verify:

1. Negative full-scale sample maps to -32768.
2. Positive full-scale sample maps to 32767.
3. Zero maps to zero.
4. Negative fractional values follow the documented rounding rule.
5. Positive fractional values follow the documented rounding rule.
6. Values below -1 clamp safely.
7. Values above +1 clamp safely.
8. Non-finite values follow the documented policy.
9. Conversion never wraps around the signed 16-bit range.

### Header construction

Verify:

10. RIFF identifier is correct.
11. RIFF chunk size is correct.
12. WAVE identifier is correct.
13. fmt identifier includes the required trailing space.
14. Format chunk size equals 16.
15. Audio format code equals 1.
16. Channel count equals 2.
17. Sample rate matches the actual encoded sample rate.
18. Byte rate is correct.
19. Block alignment equals 4 for stereo PCM16.
20. Bits per sample equals 16.
21. data identifier is correct.
22. PCM data chunk size is correct.
23. Audio data begins at offset 44.
24. Total file size matches header plus PCM data.
25. Numeric header fields use little-endian byte order.

### Stereo sample encoding

Verify:

26. Known left and right samples are interleaved correctly.
27. Negative PCM samples decode correctly.
28. The first frame is preserved.
29. The final frame is preserved.
30. No channel swap occurs.
31. The expected number of frames is encoded.
32. Sample data length is exactly frame count × four bytes.
33. The source AudioBuffer is not mutated.

Use an independent DataView-based test parser to inspect the resulting binary.

Avoid verifying the encoder solely by calling the encoder's own header helpers.

### Validation and limits

Verify:

34. Invalid input buffers are rejected.
35. Unsupported channel counts are rejected according to the documented policy.
36. Invalid sample rates are rejected.
37. Empty or invalid frame counts are rejected.
38. Excessive duration or allocation sizes are rejected before allocation.
39. Malformed channel lengths are handled safely.
40. Non-finite rendered samples trigger the documented export policy.
41. Out-of-range finite samples are handled predictably.
42. Size calculations cannot produce invalid RIFF chunk lengths.

### Blob and filename behavior

Verify:

43. The generated Blob has the audio/wav MIME type.
44. Blob size matches the encoded ArrayBuffer length.
45. The filename ends with .wav.
46. Unsafe filename characters are sanitized.
47. Path traversal components are removed or rejected.
48. Empty filename input produces a safe fallback.
49. Long filenames remain bounded.

### Browser decoding verification

Verify:

50. A representative generated WAV can be decoded using the browser's decodeAudioData capability.
51. Decoded audio has two channels.
52. Decoded duration matches the encoded frame count within appropriate tolerance.
53. Decoded sample values match expected PCM quantization within tolerance.
54. Left and right channel energy or known sample patterns remain correctly assigned.

Use a decoding context configured to avoid unintended sample-rate conversion when testing exact sample correspondence.

If the browser resamples decoded audio, account for that behavior and do not report a false exact-sample assertion.

Use tolerances appropriate to PCM16 quantization and browser audio processing.

### Export lifecycle

Verify:

55. Exporting without finalized input returns a clear rejection.
56. Starting export enters the appropriate lifecycle state.
57. Successful rendering transitions to encoding and ready states.
58. Rendering failure produces a readable error.
59. Encoding failure produces a readable error.
60. Repeated export commands do not start duplicate renders.
61. Captured input is not changed by later external mutations.
62. Cancelling prevents stale result publication.
63. Disposing prevents stale operations from restoring ready state.
64. Repeated disposal is safe.
65. Replacing an export releases obsolete owned resources.
66. Download helpers handle missing browser capabilities safely.
67. Object URL creation and cleanup follow the documented ownership policy.

Controlled substitutes may be used for browser download and asynchronous failure-injection tests.

Do not present a mocked download click as proof that a file was saved to the operating system.

### Recorded composition integration

Verify:

68. Actual controller offline input can be rendered and encoded.
69. Standard export uses 44100 Hz stereo PCM16.
70. Admitted musical content is preserved.
71. Suppressed musical notes are not reintroduced.
72. Cancelled musical notes are excluded.
73. Recorded musical timing is preserved.
74. Recorded environment and synthesis settings are preserved.
75. The exporter does not regenerate the recursive event tree.
76. The exporter does not remap musical pitches.
77. Early-stop export ends at the documented hard-cut endpoint.
78. Naturally completed export preserves the actual bounded tail.
79. WAV frame count matches the returned offline AudioBuffer.
80. Actual non-silent recordings produce non-silent decoded audio.
81. Intentionally silent valid recordings can be encoded.
82. Exporting does not mutate the saved recording.
83. Exporting does not restart the live audio engine.
84. The recording remains replayable after export.

### Demo and regression compatibility

Verify:

85. The export demo loads without unexpected JavaScript errors.
86. The demo does not autoplay audio.
87. The demo uses the actual integrated controller.
88. A finalized recording enables the export workflow.
89. The export workflow produces a valid WAV Blob.
90. Existing recursion, music, audio, visual and controller contracts remain intact.

These are verification scenarios, not a requirement to manufacture exactly 90 individual test rows.

Group related assertions into focused test cases where useful.

Add regression tests for discovered defects.

Report actual test counts.

Prioritize independently verified binary correctness and actual recorded-composition exports.

---

## Task 21 — Performance and Memory Verification

Verify that a representative export does not create unnecessary unbounded resources.

Inspect:

- Offline AudioBuffer memory.
- Encoded WAV buffer memory.
- Blob ownership.
- Object URL ownership.
- Repeated export behavior.
- Cleanup after cancellation or replacement.

Avoid retaining historical exported AudioBuffers.

Avoid retaining every previous WAV Blob.

Do not introduce an unlimited export history.

Prefer keeping only the currently prepared export result.

Perform a maximum-supported-duration or near-maximum-duration export check if practical within the existing test environment.

Record the actual duration, frame count, output size and measured execution conditions.

Do not claim a specific export speed unless measured.

Do not require the maximum-duration stress render to run repeatedly as part of every small unit test.

Document any remaining browser-memory limitations honestly.

---

## Task 22 — Manual Export Verification

Add a Phase 7 manual verification checklist to docs/TESTING.md.

Include:

### Recording and export

1. Create a short recursive composition.
2. Stop the recording.
3. Verify that export becomes available.
4. Prepare the WAV file.
5. Verify that export status feedback is understandable.
6. Download the generated WAV file.
7. Verify that the downloaded filename ends with .wav.
8. Verify that the actual file size is positive and plausible.
9. Play the downloaded file using an independent local media player.
10. Confirm that it contains the recorded musical composition.

### Audio fidelity

11. Verify that the exported melody corresponds to the recorded melody.
12. Verify that recursive musical echoes are present.
13. Verify that ambient harmony and atmosphere follow the recorded configuration.
14. Verify that stereo sound is preserved.
15. Verify that the WAV contains no unexpected clipping or distortion.
16. Verify that early-stop export follows the recorded cut.
17. Verify that natural completion preserves the appropriate audio tail.

### Stability and usability

18. Export a second composition.
19. Verify that repeated export does not create duplicate conflicting operations.
20. Verify that recording and replay still work after export.
21. Verify that export without a finalized recording is handled clearly.
22. Verify the documented cancellation behavior.
23. Verify that ready WAV files can be downloaded again where supported.
24. Verify that replacing a prepared export does not retain an unnecessary old preview.
25. Verify that download controls are keyboard accessible.

Do not mark these manual checks as passed unless actually performed.

A valid Blob or passing binary test does not prove the browser saved a file successfully.

Actual download and independent player playback must be manually confirmed.

---

## Task 23 — Regression Verification

Execute all available automated browser suites:

- tests/recursion.test.html
- tests/music.test.html
- tests/audio.test.html
- tests/visuals.test.html
- tests/sync.test.html
- tests/export.test.html

Use the existing local static HTTP and headless Microsoft Edge workflow.

Perform an automated smoke check of:

tests/export-demo.html

Verify:

- The page loads.
- The controller initializes correctly.
- Audio does not autoplay.
- A valid finalized recording can be created under supported test conditions.
- Offline rendering completes.
- WAV encoding completes.
- A valid WAV Blob is produced.
- Export metadata is displayed correctly.

If live Web Audio testing requires an autoplay override or muted output, disclose those conditions.

Do not claim that headless playback proves audible normal-browser behavior.

If an actual file download is automated, verify the resulting file through real browser or filesystem evidence.

Otherwise, leave actual download verification pending.

Wait for asynchronous tests to finish.

Do not report incomplete test output as a final result.

Report:

- Tests passed.
- Tests failed.
- Tests skipped.
- Actual execution method.
- Browser conditions.
- Relevant test errors.
- Manual verification still pending.

Run git diff --check.

Inspect the Git diff for unintended modifications.

Do not weaken existing tests to make the exporter pass.

---

## Task 24 — Documentation

Update relevant project documentation:

- README.md
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/PROJECT_PLAN.md
- docs/PROGRESS_LOG.md
- docs/TESTING.md
- docs/HACKATHON_REQUIREMENTS.md where actual deliverable status requires updating.

Document:

1. Export module architecture.
2. Actual public API.
3. Existing controller integration.
4. Finalized recording eligibility.
5. Offline rendering workflow.
6. WAV format specification.
7. RIFF/WAVE header structure.
8. PCM sample conversion.
9. Stereo interleaving.
10. Sample rate and duration limits.
11. Recorded composition fidelity.
12. Early-stop behavior.
13. Natural-completion tail behavior.
14. Monitoring-volume policy.
15. Filename generation.
16. Browser download workflow.
17. Export state management.
18. Cancellation limitations.
19. Object URL cleanup.
20. Memory limits.
21. Automated test results.
22. Manual export verification instructions.
23. Known browser limitations.
24. Remaining Phase 8 responsibilities.

Distinguish:

- Implemented WAV encoding.
- Automated binary-format verification.
- Actual browser download verification.
- Independent media-player playback verification.
- Final application integration.

Do not mark Phase 7 fully verified if required actual download and playback checks remain pending.

Use an accurate status such as implementation complete with manual download verification pending.

Do not claim the complete hackathon application is finished.

The final application interface remains a later phase.

Preserve all existing AI transcripts.

Report existing incomplete or incorrectly indexed archive entries separately.

Do not fabricate missing original prompts or agent responses.

---

## Implementation Priorities

This is a time-constrained hackathon project.

Prioritize:

1. Valid downloadable WAV files.
2. Faithful recorded musical content.
3. Correct PCM encoding and RIFF headers.
4. Correct early-stop and natural-tail behavior.
5. Reliable user-triggered downloads.
6. Safe bounded export operations.
7. Independent browser decoding verification.
8. Essential regression tests.
9. Clear documentation.

Do not spend unnecessary time implementing optional export formats, metadata editors, waveform editors, cloud uploads, advanced audio mastering or decorative interfaces.

If an optional feature threatens reliable completion of the required exporter, omit it and document the limitation.

---

## Constraints

- Vanilla JavaScript, HTML and CSS only.
- Native ES modules.
- Existing Web Audio API architecture.
- Existing OfflineAudioContext renderer.
- ArrayBuffer, DataView and Blob.
- Stereo 16-bit PCM WAV.
- No external runtime dependencies.
- No npm packages.
- No frameworks.
- No build step.
- No backend.
- No paid APIs.
- No external audio assets.
- No microphone recording.
- No cloud uploads.
- No additional audio formats.
- No duplicate recursive algorithm.
- No duplicate musical mapping algorithm.
- No duplicate synthesis engine.
- No unnecessary changes to recursion.js, music.js, audio.js, visuals.js or controller.js.
- No final application interface implementation.
- Avoid unnecessary modifications to index.html, style.css and app.js.
- Preserve all existing uncommitted work.
- Preserve existing AI transcripts.
- Do not fabricate test results.
- Do not fabricate performance measurements.
- Do not fabricate AI transcripts.
- Do not create Git commits.
- Do not push to GitHub.
- Do not begin Phase 8.

---

## Final Report

After implementation, return a structured report containing:

1. Files created.
2. Files modified.
3. Existing offline rendering compatibility findings.
4. WAV export module architecture.
5. Actual public API and function signatures.
6. Final export format specification.
7. RIFF/WAVE header implementation.
8. PCM sample conversion behavior.
9. Stereo interleaving implementation.
10. Recording eligibility policy.
11. Recorded composition fidelity.
12. Early-stop export behavior.
13. Natural-completion tail behavior.
14. Export lifecycle and concurrency handling.
15. Cancellation limitations.
16. Browser download implementation.
17. Filename sanitization.
18. Resource cleanup and memory limits.
19. Actual example WAV metadata.
20. Binary-format test results.
21. Browser decoding test results.
22. Recording integration test results.
23. Recursion regression test results.
24. Musical mapping regression test results.
25. Audio regression test results.
26. Visual regression test results.
27. Synchronization regression test results.
28. Export demo smoke-check results.
29. Actual maximum-duration or performance results, if measured.
30. Manual download and listening checks still outstanding.
31. Git diff verification.
32. Exact instructions for using the export demonstration page.
33. Necessary modifications to existing modules, if any.
34. Known limitations and unresolved archive issues.
35. Phase 7 readiness status.
36. Remaining responsibilities for Phase 8.

Keep the report understandable to a JavaScript beginner.

Implement Phase 7 now.

Do not begin Phase 8.

## Agent Response

**Phase 7 WAV export is implemented in the development demo. All 160 automated tests passed.** Saving the WAV in a normal browser and playing it in an independent media player still need manual verification. Phase 8 has not started.

### Export behavior

The exporter captures a finalized recording once and passes it to the existing offline renderer at **44,100 Hz**. It preserves admitted notes, effective timing, pan, recorded ambience, effects, and seeds. Suppressed and cancelled notes stay excluded. Monitoring volume does not affect the recording. Early stops cut all layers at the recorded endpoint, while naturally completed sessions retain the renderer’s tail of up to four seconds.

The encoder writes a **44-byte RIFF/WAVE PCM header** and interleaves left and right signed 16-bit samples in little-endian order. It uses the rendered frame count for sizes and duration. It rounds to nearest with ties away from zero, counts finite samples that require clipping, and rejects non-finite audio.

`WavExporter.prepare(controller, { filename } = {})` accepts finalized, positive-duration recordings, including silent and ambient-only recordings. It exposes `getStatus()`, `getResult()`, `cancel()`, `clear()`, `download()`, and `dispose()`. Only one render can run at a time. Cancellation discards the result but keeps the exporter busy until the browser render settles. **Download WAV** is a separate user action. It uses a sanitized filename and a temporary object URL and reports **Download requested**. [Export API](/E:/Projects/cosmic-echoes/docs/ARCHITECTURE.md#audio-export)

### Verification

| Headless Edge suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Audio | 23 | 0 | 0 |
| Visuals | 15 | 0 | 0 |
| Synchronization | 8 | 0 | 0 |
| WAV export | 13 | 0 | 0 |
| **Total** | **160** | **0** | **0** |

The run used local HTTP, an autoplay override, and muted live monitoring. Export checks used an independent binary parser, browser decoding, and actual controller recordings. Download lifecycle tests used controlled substitutes.

The demo prepared `cosmic-echoes-deep-space-session-1.wav` from a stopped 15-event recording. It contained **123,232 bytes**, approximately **0.698 seconds** of stereo PCM16 audio, and zero clipped samples. A separate maximum-length check produced **64 seconds**, **2,822,400 frames**, and **11,289,644 bytes**, also with zero clipped samples. Export speed and browser memory use were not measured.

### Files and next check

- **Created** [js/export.js](/E:/Projects/cosmic-echoes/js/export.js), `tests/export-demo.html`, `tests/export-demo.js`, `tests/export.test.html`, and `tests/export.test.js`.
- **Updated** `README.md`, `AGENTS.md`, and the architecture, hackathon requirements, project plan, progress log, and testing docs.
- `git diff --check` passed. Existing engines, controller, main app files, and AI records were preserved. Older archive gaps remain, including the empty `020` record labeled Archived. Nothing was committed or pushed.

Run `python -m http.server 8000 --bind 127.0.0.1` from the project root and open `http://127.0.0.1:8000/tests/export-demo.html`. Select **Start session**, place stars, stop or wait for completion, then select **Prepare WAV** and **Download WAV**. Verify the saved file with an independent player using the [manual checklist](/E:/Projects/cosmic-echoes/docs/TESTING.md#phase-7-manual-wav-verification). Phase 8 will integrate the workflow into the final application interface.
