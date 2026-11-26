# Testing Record

## Status

On 2026-11-26 all three suites ran in headless Microsoft Edge over Python loopback HTTP. The browser debugger waited for final asynchronous summaries. Audio used `?live=1` and `--autoplay-policy=no-user-gesture-required`, with live test engines muted. Offline tests measured actual AudioBuffer samples.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Audio | 23 | 0 | 0 |
| **Total** | **124** | **0** | **0** |

These are results from the prior automated run. The suites were not rerun during Phase 4 closure.

The initial audio run revealed a signed-zero noise endpoint and two wall-clock-sensitive transport assertions. The revised checks wait for audio-clock progress. In the final 44,100 Hz render, eight melody voices, two pads and one atmosphere source played at full master volume. Across dry, default and fully wet mixes, absolute peaks were **0.393525 left** and **0.171352 right**, below the 0.95 target. The demo generated mapped notes with its context still uninitialized.

From the project root, run `python -m http.server 8000 --bind 127.0.0.1` using an existing Python installation or serve the root through another static HTTP server. Open `http://127.0.0.1:8000/tests/recursion.test.html` and `http://127.0.0.1:8000/tests/music.test.html` in a browser and check the summaries and individual results. Stop the server with Ctrl+C.

Automated checks measure expected behavior. Browser checks exercise the interface and timing. Listening checks assess the audible result.

| ID | Test | Method | Expected result | Status |
|---|---|---|---|---|
| T01 | Depth zero | Automated | One root event and no children. | Passed (standalone) |
| T02 | Default binary depth three | Automated | Exactly 15 events including the root. | Passed (standalone) |
| T03 | Maximum depth | Automated | Depth never exceeds 4. | Passed (standalone) |
| T04 | Identical inputs | Automated | Identical event IDs, order, geometry, timing and parent links. | Passed (standalone) |
| T05 | Audio initialization | Browser | Audio initializes only after a user gesture. | Pending |
| T06 | Default musical scale | Automated | Generated melodic notes belong to C major pentatonic. | Passed (standalone) |
| T07 | Polyphony | Automated + browser | At most 8 simultaneous melodic voices across roots. | Pending |
| T08 | Audio-visual synchronization | Browser | Visuals and notes match event timing on the Web Audio clock. | Pending |
| T09 | Playback controls | Browser | Play starts at zero, Pause freezes both streams, and Resume continues from the saved playhead without replaying prior onsets. | Pending |
| T10 | Export validity | Automated + browser | Playable stereo 16-bit PCM WAV at 44,100 Hz, with a default 60-second composition and up to 4 additional seconds of tail. | Pending |
| T11 | Keyboard accessibility | Browser | All essential controls and canvas interactions are keyboard-operable, with visible focus. | Pending |
| T12 | Responsive layout | Browser | Canvas and controls remain usable at narrow and wide viewport sizes. | Pending |
| T13 | Invalid or non-finite inputs | Automated | NaN and infinities restore defaults or cause rejection when no default exists. Invalid events do not enter the timeline. | Passed (standalone) |
| T14 | Parameter boundaries | Automated | Accept exact endpoints, clamp finite values outside the range, and round fractional depth and child counts. | Passed (standalone) |
| T15 | Maximum events per root | Automated | Depth 4 and branching factor 3 produce exactly 121 events including the root. | Passed (standalone) |
| T16 | Global event limits | Automated + browser | Across several roots, combined pending and active recursive events and active visual events each stay at or below 300. A placement exceeding capacity is declined with feedback and creates no queued work. A later placement succeeds when capacity is available. | Pending |
| T17 | Parent-child integrity | Automated | IDs are unique, each child references an existing parent with the same root, and depth increases by one. | Passed (standalone) |
| T18 | Tempo and delay | Automated | A configured 0.8-second delay gives 1.1 seconds at 40 BPM, 0.8 at 55 BPM and 0.55 at 80 BPM. | Passed (standalone) |
| T19 | Clipping | Automated + listening | The peak stays below full scale under dense playback and export. Listen for audible distortion. | Pending |
| T20 | Rapid repeated actions | Browser | Repeated input and control actions respect caps, leave declined placements unqueued, and do not create duplicate schedulers or stale playback. | Pending |
| T21 | Stop and Reset | Browser | Stop fades and cancels playback, clears active visuals, and preserves the composition. Reset also clears event and parameter history and restores defaults. | Pending |
| T22 | Offline export parity | Automated + listening | Offline render uses the same recorded events, timings, parameter changes, and synthesis settings. Compare representative playback and export by ear. | Pending |
| T23 | Export ambience and effects | Automated + listening | Ambient layers and effects remain audible in the WAV, with a reverb tail of at most 4 seconds. | Pending |
| T24 | Reduced motion | Browser | With the reduced-motion preference enabled, motion is reduced and essential controls remain usable. | Pending |

The standalone capacity helper passed exact-fit, rejection and invalid-occupancy checks. T16 and T20 remain pending for controller integration. Standalone user-gesture playback and listening passed the developer-reported checks below. Future application integration tests, including synchronization and WAV export, remain pending.

## Phase 7 automated verification

On 2026-11-26, headless Microsoft Edge ran six test pages over local Python HTTP. The debugger waited for final asynchronous summaries. Live audio, synchronization and export groups used `?live=1` and an autoplay override with muted monitoring. Binary tests used an independent DataView parser and browser decoding at the matching rate. Download and URL lifetime tests used controlled anchor and object URL substitutes.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Procedural audio | 23 | 0 | 0 |
| Visual engine | 15 | 0 | 0 |
| Synchronization | 8 | 0 | 0 |
| WAV export | 13 | 0 | 0 |
| **Total** | **160** | **0** | **0** |

The export tests covered actual early-stop and completed recordings, cancellation and suppressed note exclusion, browser decoding, replay after export and a silent recording. The demo started with an uninitialized audio context, recorded a 15-event tree, stopped, and prepared `cosmic-echoes-deep-space-session-1.wav`: 123,232 bytes, 44,100 Hz, stereo PCM16, approximately 0.698 seconds, and zero clipped samples. No page errors were reported.

A separate maximum-size check used the real offline renderer with a 60-second ambient-only fixture and a four-second capped tail. It prepared 2,822,400 frames and an 11,289,644-byte Blob with zero clipped samples. No export speed or browser memory footprint was measured.

## Phase 7 manual WAV verification

**Pending.** Serve the root with `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/tests/export-demo.html` in a regular browser.

1. Start a short session, place a single root and a binary tree, and stop. Check eligibility and status, then choose Prepare WAV and Download WAV using the keyboard as well as the pointer.
2. Verify the downloaded filename, file size and independent local-player playback. Check the recorded melody, recursive echoes, ambience, atmosphere, stereo placement and absence of unexpected distortion.
3. Compare an early stop with natural completion. Verify the hard cut and expected bounded tail. Try multiple roots, overlapping roots and an ambient-only recording.
4. Prepare another WAV, try repeat actions during rendering, cancel a long render, and wait for the busy state to clear. Check replacement cleanup, re-download, and recording and replay after export. Confirm export stays unavailable before finalization.

Headless Blob generation, browser decoding and a mocked anchor request do not verify an operating-system save. Actual save and independent-player playback remain pending.

## Phase 6 automated verification

On 2026-11-26, Microsoft Edge ran all five browser suites headlessly over Python loopback HTTP. Browser debugger polling waited for the final summaries. Audio and sync used `?live=1` with an autoplay override and muted monitoring. Offline checks inspected real stereo AudioBuffer samples.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Procedural audio | 23 | 0 | 0 |
| Visual engine | 15 | 0 | 0 |
| Synchronized integration | 8 | 0 | 0 |
| **Total** | **147** | **0** | **0** |

The eight integration cases group live placement, rollback, shared capacity, configuration snapshots, pause and resume, natural completion, cleanup, suppression, replay and offline rendering. Headless smoke checks loaded both older demos. The synchronized demo started with AudioContext uninitialized, accepted the 15-event binary scenario, reported one admitted melody voice and one active star, and cleared live occupancy on stop without reported JavaScript errors. A foreground debugger sample reported **18.7 ms logical render lag** at roughly 0.58 seconds into the session, with one active star and fourteen pending. This measures clock sampling versus latest Canvas render. Physical audio-to-display latency and subjective synchronization are pending.

These five suite totals come from the prior implementation run. No suites were rerun during closure. The prior run used real Web Audio and Canvas in headless Edge. The transaction failure cases used controlled exceptions. The prior smoke check verified idle, start, placement, scheduling, visible activity and stop; snapshot, replay and other lifecycle checks were exercised by the integration suite and developer manual checks.

During closure, a separate headless Edge check used the same autoplay override and muted live monitoring. A completed 2-second session with 12 simultaneous root candidates recorded 8 admitted melodies and 4 suppressed IDs. The offline adapter excluded all 4 suppressed IDs. Rendering produced two finite, non-silent channels at 44,100 Hz and 119,071 frames, approximately 2.70002 seconds including the 0.7-second tail rounded up to a frame. The earlier integration suite separately verified early-stop hard-cut duration and cancellation. This targeted check is separate from the 147 suite results.

## Phase 6 developer-reported manual results

The developer reported **28 of 28 passes** in normal browser use. No manual synchronization-latency or frame-rate measurements were reported. No additional observations were supplied.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Integrated experience | No autoplay. Start produces audible playback. Root star and note appear together. Recursive visuals and notes appear together. Independent roots coexist. Placements leave playback running. Ambient harmony continues. Scale and theme correspond. | 8 |
| Playback and recording | Pause freezes both streams. Resume continues from the same position. Stop silences audio and stops animation. Replay starts at the beginning and reproduces the celestial structure and music. Parameter changes affect future placements only. Natural completion works. | 8 |
| Capacity and stability | Near-capacity scenes remain usable. Excess placements are rejected clearly. Melody stays within eight voices. Suppressed notes retain visuals. Rapid clicks do not duplicate trees. Rapid transport commands and repeated reset/replay remain stable. | 7 |
| Accessibility and experience | Keyboard placement works. Reduced motion works. Volume works. Controls and feedback are readable. The combined experience feels calm and coherent. | 5 |

## Phase 6 manual integrated verification

For repeat checks, Serve the repository using `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/tests/sync-demo.html` in a regular browser with normal autoplay policy.

1. Confirm no autoplay, start with a gesture at low volume, and place a root by pointer and by keyboard. Check the visible and audible root and child responses, all environments, and continuous ambient harmony during additional placements.
2. Pause and resume both streams, change recursion parameters for new placements, stop, replay the same tree and notes, and allow a session to complete naturally. Retry rapid transport commands.
3. Place several roots, run the capacity and voice-stress scenarios, and confirm polite rejection, no duplicate trees, at most eight melodic voices, and visual continuity for suppressed notes. Repeat reset and replay.
4. Toggle reduced motion, check labels and status, and adjust monitoring volume. Record perceived timing, audio or visual artifacts, calmness, browser and output device. Mobile touch and hardware latency are separate checks.

## Phase 5 automated verification

On 2026-11-26, headless Microsoft Edge ran all four suites through a local Python HTTP server. The browser debugger waited for each final asynchronous summary. The audio regression used the prior muted live test workflow with the autoplay override and `?live=1`.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Procedural audio | 23 | 0 | 0 |
| Visual engine | 15 | 0 | 0 |
| **Total** | **139** | **0** | **0** |

The first visual run found a one-value RGB difference after resize. The final run used a small per-channel tolerance and verified exact backing-store sizes and transforms. The 15 visual cases group configuration, coordinate, real Canvas pixel, timeline, relationship, capacity and controlled callback assertions. A synthetic 300-active-event frame was drawn without error.

The demo smoke check loaded the 15-event binary scenario, exercised the center placement button, loaded 300 events, rejected an additional tree, advanced and paused. The page reported no JavaScript errors and made no request for the audio module. A diagnostic sample showed approximately **58 FPS** at DPR 1, approximately 680 × 283 CSS pixels, with 300 occupied events and five active stars early in the stress scenario. This is a headless sample. Representative desktop and mobile performance is still pending.

The Phase 5 closure uses this prior automated run. No suites were rerun during closure.

## Phase 5 developer-reported manual results

The developer reported **29 passed out of 29** on the standalone visual demo. No manual frame rate was measured. Mobile and touch results were not reported. No additional observations were supplied.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Visual appearance | Calm and immersive background. Roots distinguishable. Smaller, softer echoes. Progressive generations. Smooth ripple expansion and fade. Correct constellation links. Gentle star fades. Subtle particles. Consistent themes. | 9 |
| Interaction | Accurate mouse placement. Keyboard placement. Parameter changes affect new stars. Multiple roots coexist. Safe capacity rejection. Clear Universe removes events. Pause freezes time. Resume continues correctly. | 8 |
| Responsiveness and accessibility | Proportional resize. Sharp on the available display. Usable narrow layout. Reduced motion works. Recursion remains recognizable in reduced motion. Keyboard-accessible controls. | 6 |
| Performance and stability | Maximum ternary tree renders. Near-capacity scene usable. Expired capacity released with repeated placements. Stable theme changes. Resize works during animation. No noticeable degradation during prolonged use. | 6 |

Standalone closure evidence consists of **139 automated passes** and **29 developer-reported manual passes**. Application-wide synchronization remains pending.

## Phase 5 manual visual checklist

For repeat checks and outstanding mobile and touch coverage, serve the repo with `python -m http.server 8000 --bind 127.0.0.1`. Open `http://127.0.0.1:8000/tests/visuals-demo.html`, choose a scenario, select Load scenario and press Start. For technical checks, open `/tests/visuals.test.html` on the same server. Record desktop and touch-device results separately.

- **Appearance** — Check the calm background, root prominence, smaller and softer child echoes, progressive generations, smooth ripples, accurate links, gentle fades, subtle particles, absence of flashing, and readability across all three themes.
- **Interaction** — Check pointer position, touch placement on a supported device, keyboard and center placement, depth and branching changes for future trees, independent roots, safe rejection at capacity, Clear Universe, pause and resume.
- **Responsive and accessible behavior** — Resize during animation and confirm proportional positions, high-DPI sharpness, narrow-screen usability, reduced motion with recognizable recursion, visible focus and labels, and status outside the canvas.
- **Stability and performance** — Try the maximum ternary and near-capacity scenarios. Repeat placements and theme switching, watch occupied and retained counts decline, resize during playback, and record approximate FPS with browser, device, canvas size, DPR and active event count. Observe prolonged use.

Phase 6 audio-clock integration is verified in the standalone synchronized demo. Final application integration tests remain pending.

## Phase 4 developer-reported manual results

The developer tested the standalone audio demo using normal browser playback and reported **20 passed out of 20**. These checks are separate from the automated results above.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Basic playback | No audio before Play. Play produces audible music. Pause freezes playback. Resume continues from the same position. Stop silences playback. Replay works. | 6 |
| Sound quality | Root sounds soft and pleasant. Echoes sound related to the root. Ambient harmony supports the melody. Atmosphere is unobtrusive. Reverb sounds spacious. No noticeable clicks or harsh peaks. Stereo feels balanced. | 7 |
| Stress and interaction | Maximum ternary tree plays correctly. Multiple roots play correctly. At most eight melodic voices. Smooth volume changes. All three environments work. Rapid commands behave correctly. Natural completion works. | 7 |

Combined standalone evidence is **124 automated passes and 20 developer-reported manual passes**.

## Phase 4 manual listening checklist

From the project root, run `python -m http.server 8000 --bind 127.0.0.1`. Open `http://127.0.0.1:8000/tests/audio-demo.html` in a regular browser. The automated counterpart at `/tests/audio.test.html` runs offline tests on a normal visit and skips the optional live transport group.

1. Confirm the page opens silently. Generate the default binary tree and confirm the context remains uninitialized until Play.
2. Play at low volume. Compare One root note and the binary tree. Listen for the Starlight tone, the quieter Echo voices and the parent-child melody relationship.
3. Mute and restore ambient harmony and atmosphere independently. Compare Ambient harmony only, Melody only, dry and reverberant playback.
4. Compare all three environments. Try maximum ternary and two-root scenarios and listen for harsh peaks or distracting density.
5. Try left, center and right roots. Move master volume during playback and listen for clicks or abrupt volume changes.
6. Pause and confirm the clock freezes. Resume and confirm playback continues. Stop and confirm silence, then replay.
7. Try rapid playback commands and let a composition finish naturally. Check the endpoint and control states.

If tuning is needed, reduce the Starlight harmonic blend or cutoff for harshness, shorten release for ringing, lower pads or reverb for muddy bass, and lower atmosphere if it masks melody. Try a lower voice cap for density or a smaller pan range for imbalance. If sliders click, inspect the smoothing on the audio clock. Record browser, output device, scenario and observations.
