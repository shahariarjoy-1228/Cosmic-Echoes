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

## Phase 10 automated QA

On 2026-11-26, QA started at clean commit `2f34d8e` on Windows. Local Python HTTP served the workspace to fresh, isolated headless browser profiles. Debugger polling waited for final summaries. Live test pages used `?live=1`, an autoplay override and muted monitoring. No virtual time was used. Tests exercised real Canvas, Web Audio, recording, offline rendering and browser decoding. Existing lifecycle tests inject failures or control scheduling, and controlled download requests cannot prove disk saving.

| Edge 158.0.4370.33 page | Passed | Failed | Skipped |
|---|---:|---:|---:|
| recursion.test.html | 32 | 0 | 0 |
| music.test.html | 69 | 0 | 0 |
| audio.test.html | 23 | 0 | 0 |
| visuals.test.html | 15 | 0 | 0 |
| sync.test.html | 8 | 0 | 0 |
| export.test.html | 13 | 0 | 0 |
| app.test.html | 7 | 0 | 0 |
| creative.test.html | 7 | 0 | 0 |
| final.test.html | 5 | 0 | 0 |
| **Total** | **179** | **0** | **0** |

The eight existing suites repeated the 174 baseline passes. The five extra cases supplement that coverage. Chrome 158.0.8127.38 passed the root and creative suites (7 + 7, zero failures or skips) under a local `/preview/` prefix. These repeat the same cases and are excluded from the unique Edge total. Firefox and Safari were not available in the test environment. Edge and Chrome both loaded all four development demos and the root with no reported page errors. The root smoke checks found no external resource requests. An additional Edge run used a trusted browser click with the default autoplay policy and muted monitoring. It started, placed a 15-event tree, and stopped.

### End-to-end and stress evidence

- Root and creative tests exercised silent startup, pointers and keyboard placement, presets and Auto Meditation, pause/resume, live scheduling and Canvas, stop and finalization, actual WAV generation, and replay without adding roots. A timed logical scheduler check covers delayed ticks and capacity rejections. A physical hidden-tab/audio-background session was not tested.
- The extra suite checked tree counts **1, 2, 3, 15, 40, 121**, deterministic IDs, geometry and valid parent links. Two 121-event trees were accepted. A third was rejected atomically. The record stayed at **242** while occupied events fell to **216** after about two seconds. Peak melodic voices were **8**, with **2** pad voices and **1** atmosphere source. Existing sync tests checked the exact 300-event boundary, rollback, and historical capacity after expirations.
- One real controller ran three consecutive recording, WAV preparation and replay cycles with two depth-zero roots per cycle. Root settings retained their different tempos. Snapshot edits did not reach the controller. Suppressed and cancelled notes stayed out of adapter input. Stop cleared scheduled voices and occupied visuals. This is bounded lifecycle evidence, and heap or long-run leak profiling remains open.
- The partial-operation root check recovered from a controlled AudioContext startup rejection. It then issued five Start clicks, 24 Focus toggles, 24 Auto Meditation toggles, 24 preset selections, ten center placements, one cancelled and one accepted synthetic touch-style gesture, and two each of Pause, Resume, Stop and Reset. It recorded **33** stars with no unexpected errors. Prior regression cases covered offline and encoding errors, cancellation settlement, stale-result rejection and object URL cleanup.

### Synchronization and WAV measurements

In Edge's foreground headless tab, 30 samples were taken approximately 20 ms apart using `getDiagnostics().logicalTimelineDifference`. The sample session used two depth-zero roots with Quiet Orbit-derived and Starlight-derived settings at 45 and 55 BPM. The maximum gap was **21.33 ms** and median **10.67 ms**. This compares the sampled audio clock to the latest Canvas render timestamp. Physical speaker-to-display latency was not measured.

An independent DataView parser checked all standard RIFF/WAVE identifiers, format fields, sample rate, alignment, byte rate and exact lengths. All examples were 44,100 Hz stereo signed PCM16 with no clipped samples. Existing decoding tests verified signed quantization and left/right interleaving independently.

| Test output | Recording endpoint | Rendered duration | Frames | PCM bytes | WAV bytes |
|---|---:|---:|---:|---:|---:|
| Early stop, cycle 1 | 0.906333 s | 0.906349 s | 39,970 | 159,880 | 159,924 |
| Early stop, cycle 2 | 0.405 s | 0.405011 s | 17,861 | 71,444 | 71,488 |
| Natural completion | 2.5 s | 3.2 s | 141,120 | 564,480 | 564,524 |
| Maximum ambient fixture | 60 s | 64 s | 2,822,400 | 11,289,600 | 11,289,644 |

Early stops add no tail beyond frame rounding. Natural completion added the observed 0.7-second tail. The maximum check used an ambient-only adapter fixture with real offline synthesis and a four-second capped tail. It did not require a 60-second live session. Export speed and memory usage were not measured. The separate audio stress test measured sample peaks of 0.393525 left and 0.171352 right in its tested mixes.

### Layout, accessibility and defects

- Fresh normal layout tests passed at **320, 375, 390, 768, 1024 and 1440 CSS pixels**. Focus Mode passed at **320, 390, 768 and 1440**. A separate **667 × 375 CSS-pixel** landscape check at emulated DPR 2 passed with no horizontal overflow and positive Canvas bounds in both modes.
- The root has a single main heading, semantic regions, native labelled controls, center and coordinate placement, and status and alert text. Browser Tab showed the visible skip-link focus indicator. Focus Mode hides secondary controls from focus order. Emulated system reduced motion produced reduced rendering and zero button transition duration. Explicit reduced motion was also exercised during a live session. Physical touch, device audio, zoom, screen readers and formal accessibility conformance remain manual or outside the tested scope.
- Initial separate landscape tooling read the diagnostics before its asynchronous UI update. Waiting for that update fixed the measurement procedure. No application defect requiring a source fix was found within this scope. There are no known unresolved blocker or high-severity findings from these checks.

### Acceptance and archive

All six product deliverables retain their verified status from the [requirements map](HACKATHON_REQUIREMENTS.md). Fresh recursion and app tests covered configurable recursion; visual and sync tests covered interactive Canvas; music and audio verified recursive synthesis; app and sync verified transport; export and final tests verified WAV encoding; and root and creative tests verified the accessible controls and responsive layout. The developer separately reported 50 of 50 Phase 10 manual checks passed, including listening, actual download and independent playback. The cumulative manual total is 236 passes across Phases 4–10.

Archive records 013, 015 and 018 have archived prompt and response text. Entries 001–012, 014, 017 and 019 are incomplete, and 016 is empty. The extra 018 file is empty and unindexed. Empty entries 020 and 026 are outside the table with inaccurate Archived labels. Phase 5, 6, 8, 9 and later exchanges need original archival or confirmation. Product acceptance does not close the AI transcript submission requirement.

## Phase 10 manual acceptance

**Developer-reported result: 50 passed, 0 failed, 0 unverified within the consolidated checklist.** No browser, device, viewport, downloaded WAV metadata or additional observations were supplied. Physical mobile touch, screen-reader and additional device checks were not separately reported.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Startup and usability | Root loads. Initial Canvas appears. No audio before activation. Starting is intuitive. Initial volume is comfortable. Instructions are clear. | 6 |
| Core audio and visuals | Manual placement produces both streams. Child generations appear. Multiple roots coexist. All three environments work. Changes apply only to future placements. Maximum depth is usable. Capacity rejection is clear. No obvious clipping or distortion. | 8 |
| Transport and recording | Pause freezes both streams. Resume continues. Stop finalizes. Natural completion works. Replay reproduces the recording. Reset follows discard policy. Rapid ordinary actions remain stable. | 7 |
| Creative features | Gentle auto roots. Meditation pause and resume. Meditation stops with recording. Focus retains essential controls. Focus entry and exit are easy. All four presets work. Edited presets show Custom. | 7 |
| WAV export | Finalized recording exports. Actual download succeeds. Independent playback works. Export matches the recording. Early stop preserves the hard cut. Natural export retains the tail. Repeat exports remain stable. Cancellation works. | 8 |
| Accessibility and responsiveness | Keyboard controls and placement work. Focus remains visible. No obvious keyboard trap. Reduced motion works. Text and labels are readable. Desktop and narrow layouts are usable. No unwanted horizontal scrolling. Increased browser zoom is usable. | 10 |
| Stability and overall experience | Consecutive sessions work. Repeated recording and replay remain stable. Repeated Focus and Meditation toggles remain stable. The experience feels calm and coherent. | 4 |

The production source is unchanged from the tested baseline. No suites reran in closure. The prior automated evidence remains 179 Edge passes plus 14 repeated Chrome passes, with zero failures or skips. The examples in the WAV table above were independently parsed. Browser decoding was verified separately on representative export-suite fixtures and an early-stop WAV. The developer's file was independently played and its exact metadata was not recorded. No product defects were identified or fixed in this scope (0 blocker, high, medium or low). The earlier diagnostics sampling issue was in the test procedure.

For repeat checks, from the project root run `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/` in a normal browser. Record browser version, device, viewport and results.

- Verify initial load, Canvas, instructions, no autoplay and comfortable monitoring volume. Place manual and multiple roots in every environment, try maximum depth and capacity rejection, and listen for synchronized echoes, clipping, distortion or excessive overlap.
- Pause, resume, stop, allow natural completion, replay and reset. Repeat several sessions and rapid ordinary transport controls. Try all presets, Custom, Auto Meditation pause/resume and completion, and Focus entry/exit with essential controls preserved.
- Prepare, cancel, repeat and save WAVs, and verify independent playback, recorded content, early-stop cutoff and natural tail. Check export eligibility and replacement after new recordings.
- Check keyboard-only navigation without traps, visible focus, center placement, labels, feedback, reduced motion, desktop and narrow views, proportional resize, horizontal overflow and browser zoom. Evaluate overall calmness and prolonged use.
- Record physical mobile touch/audio/download, additional browsers, screen-reader results or measured timing/export performance only when actually performed.

Phase 10 is complete. Cosmic Echoes is a verified hackathon release candidate within the tested scope. Phase 11 awaits explicit authorization. AI archive compliance remains unresolved.

## Phase 9 automated verification

On 2026-11-26, headless Microsoft Edge ran eight browser suites over a local Python HTTP server. The browser debugger waited for asynchronous summaries. Live suites used `?live=1`, an autoplay override and muted monitoring. Scheduler edge cases used controlled positions and rejection responses. The real creative workflow used the actual same-origin root app, Web Audio, Canvas and offline renderer. The download anchor click was controlled.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Procedural audio | 23 | 0 | 0 |
| Visual engine | 15 | 0 | 0 |
| Synchronization | 8 | 0 | 0 |
| WAV export | 13 | 0 | 0 |
| Root application | 7 | 0 | 0 |
| Creative features | 7 | 0 | 0 |
| **Total** | **174** | **0** | **0** |

The root workflow started silent, selected Quiet Orbit, recorded one real automatic root and one manual root, paused and resumed, toggled Focus Mode, and recorded another manual root under Starlight. It finalized 21 celestial events and prepared an independently parsed 44.1 kHz stereo PCM16 WAV. Replay kept Auto Meditation off and preserved the recording and prepared metadata. The root smoke check and all four development demo loads passed. The normal layout was checked at 320, 375, 390, 768, 1024 and 1440 CSS pixels. Focus Mode was checked at 320, 390, 768 and 1440 CSS pixels. Browser viewport checks do not establish physical touch or screen-reader behavior.

The eight suite totals and viewport checks above are from the implementation run. The suites were not rerun during closure. The direct smoke check covered idle load, the Canvas and visible Tab focus. The same-origin workflow separately exercised actual auto and manual placement, pause and resume, Focus Mode, finalization, WAV header parsing and replay. Controlled download requests did not verify disk saving.

## Phase 9 developer-reported manual results

The developer reported **38 of 38 checks passed**, including actual browser download and independent media-player playback. Browser, device and exact manual viewport details were not recorded. Physical mobile touch and formal accessibility or screen-reader verification were not reported. There were no additional observations.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Auto Meditation | Off by default. Respects audio activation. Gentle intervals. Synchronized audio and visuals. Manual placement remains available. Pause freezes placements. Resume continues. Stop prevents new roots. Completion disables it. Recording limit is clear. Repeated toggles are stable. | 11 |
| Focus Mode | Canvas is prominent. Essential playback and keyboard placement remain available. Easy exit. Layout changes preserve playback and recording. Placement survives resize. The layout feels calm. | 8 |
| Recursion presets | Four presets are available. Controls and event counts match. Presets create distinct experiences. Existing events persist. Manual editing shows Custom. Environments stay independent. | 7 |
| Recording and export | Automatic and manual roots are recorded together. Replay creates no new roots. A recording with automatic roots exports. The downloaded file plays independently. Exported music matches the recording. | 5 |
| Accessibility and overall experience | Keyboard operation. Visible focus. Reduced motion. Usable narrow layouts. Unobtrusive feedback. No obvious audio or visual regression. Creative features improve the experience. | 7 |

The automated total remains **174 passes**, separate from **186 developer-reported manual passes** across Phases 4–9.

## Phase 9 manual verification

For repeat checks, Serve the project root with `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/` in a normal browser.

- **Auto Meditation:** Confirm it is off before starting and cannot activate audio. Start with Quiet Orbit, enable it, watch and listen for automatic roots, add a manual root, pause and resume, stop, and let a separate session finish naturally. Try rapid toggles and dense presets near both capacity limits. Look for clear feedback and no bursts after backgrounding.
- **Focus Mode:** Use keyboard and pointer entry/exit, including Escape. Check Canvas emphasis, proportional placement after resize, transport, volume, center placement, Auto Meditation controls, progress and recording status. Confirm the timeline and prepared WAV survive layout changes.
- **Presets:** Verify all four, the six control values, event counts, the Custom state and the unchanged environment. Switch during recording and confirm older stars retain their configuration.
- **Recording and WAV:** Record manual and automatic roots together. Stop and replay without automatic generation. Save the exported WAV, play it independently, and compare music and timing with the session.
- **Accessibility and polish:** Check visible focus, labels, reduced motion, clean narrow layouts, uncluttered announcements, and physical touch where available. Record browser, device, viewport and subjective observations. Normal audible playback and actual file saving were outside the Phase 9 headless verification.

## Phase 8 automated verification

On 2026-11-26, headless Microsoft Edge ran seven browser suites over a local Python HTTP server. The debugger waited for final asynchronous summaries. Live audio, sync, export and app cases used `?live=1`, an autoplay override and muted monitoring. Tests exercised the real root app in a same-origin iframe. Export render failure and delayed completion used controlled substitutes, as did the final anchor click.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Procedural audio | 23 | 0 | 0 |
| Visual engine | 15 | 0 | 0 |
| Synchronization | 8 | 0 | 0 |
| WAV export | 13 | 0 | 0 |
| Root application | 7 | 0 | 0 |
| **Total** | **167** | **0** | **0** |

The application cases cover startup, labels, environment and motion, viewport sizing, pointer and coordinate placement, transport, cancellation, recovery, PCM header inspection and replay. Layout was tested at 320, 375, 390, 768, 1024 and 1440 CSS pixels. A 1440 × 960 root smoke check found an idle page, a 968 × 547 backing canvas, no reported page errors and no external resource requests. A browser Tab event exposed the skip link with a solid outline. All four previous demos loaded. Synthetic touch-drag checks covered the handler without testing physical hardware.

The seven suite totals and viewport evidence are from the implementation run. The suites were not rerun during closure. The direct root smoke checked idle load, Canvas, no reported errors or external requests, and visible Tab focus. The same-origin application suite separately exercised actual placement, scheduling, Canvas activity, stop and finalization, Blob metadata and replay. The anchor click was controlled. The developer separately confirmed file saving and independent playback.

## Phase 8 developer-reported manual results

The developer reported **47 of 47 passes**. Browsers, devices and exact manual viewport sizes were not recorded. Physical mobile touch and formal screen-reader or accessibility audit results were not reported. No additional observations were supplied.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Initial experience | Root loads. Branding and instructions are clear. Initial Canvas renders. No audio before activation. Starting is intuitive. Initial volume is comfortable. | 6 |
| Audio and visuals | Placement creates synchronized audio and visuals. Recursive echoes emerge. Multiple roots coexist during playback. All three environments work. Recursion controls are clear. Advanced settings are accessible. Parameter changes apply only to future placements. Event-count feedback is correct. | 8 |
| Playback and recording | Pause freezes both streams. Resume continues. Stop finalizes. Replay reproduces the recording. Natural completion updates the interface. Discard behavior is clear. | 6 |
| WAV export | Export is unavailable without finalization. Root preparation succeeds. Status is clear. File downloads. Independent playback works. Cancellation works. A second recording exports. Old and new results remain distinct. | 8 |
| Accessibility | Primary controls are keyboard-operable. Keyboard placement works. Focus is visible. Labels and units are clear. Reduced motion works. Feedback appears outside Canvas. Important text is readable. Help and settings are accessible. | 8 |
| Responsive layout | Desktop is comfortable. Narrow layout is usable. No unwanted horizontal scrolling. Resize preserves placement. Controls remain usable under zoom. | 5 |
| Overall experience | Visual hierarchy feels polished. Canvas remains the focus. Experience feels calm. Diagnostics are unobtrusive. Rapid ordinary actions are stable. Core features are available at the root. | 6 |

The automated total remains **167 passes**, separate from **148 developer-reported manual passes** across Phases 4–8.

## Phase 8 manual application verification

For repeat checks, Serve the repository root with `python -m http.server 8000 --bind 127.0.0.1`. Open `http://127.0.0.1:8000/` in a regular browser with normal autoplay policy.

- Confirm branding, initial sky and onboarding, silence before Start, and comfortable sound after starting. Place several mouse or touch stars and compare root and recursive notes with their visuals. Try each environment, change all recursion settings and confirm the preview and future-placement behavior.
- Pause and resume, stop and replay, allow natural completion, and verify what Clear recording discards. Try rapid ordinary actions and confirm feedback and calm visuals remain usable.
- Confirm export is unavailable before finalization. Prepare WAV, cancel a separate render, download a file and play it in an independent player. Export a second recording and check that no obsolete metadata survives the new session. Use the keyboard for both placement and export.
- Navigate with Tab and a screen reader where available. Check labels, focus, units, alerts, help, and visual toggles. Try system and explicit reduced motion. Check narrow layout, increased zoom, resize during playback, and actual touch on suitable hardware. Record the device and browser separately.
- Confirm every core action works from the root. Keep subjective appearance, perceived synchronization, normal autoplay behavior, file saving and cross-browser results separate from headless evidence.

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

The six suite totals above are from the implementation run. No suites were rerun for closure. Binary parsing, independent decoding and recorded-composition rendering used actual browser output. Failure injection, anchor clicks and object URL ownership checks used controlled substitutes. The prior demo smoke check reached a ready WAV with displayed metadata. The developer separately verified the real download and cancellation/replacement workflow.

### Phase 7 targeted WAV check during closure

A separate headless Edge check used local HTTP, an autoplay override and muted live monitoring. Both files came from actual controller recordings. An independent DataView reader confirmed RIFF, WAVE, fmt and data identifiers, exact chunk lengths, PCM format code 1, 176,400 bytes/s and four-byte block alignment. Both were 44,100 Hz stereo PCM16 with MIME type audio/wav and zero clipped samples. Successful encoding rejects non-finite samples.

| Recording | Endpoint | Rendered duration | Tail policy | Frames | PCM bytes | WAV bytes |
|---|---:|---:|---|---:|---:|---:|
| Early stop | 0.477 s | 0.4770068 s | None, rounded up to a frame | 21,036 | 84,144 | 84,188 |
| Natural completion | 2.000 s | 2.7000227 s | 0.700 s, rounded up to a frame | 119,071 | 476,284 | 476,328 |

These are automated test outputs. The developer did not record exact metadata for the manually downloaded file.

## Phase 7 developer-reported manual results

The developer reported **24 of 24 checks passed** in normal browser use. This includes an actual saved file and independent media-player playback. No filename, duration, size, player name, performance measurements or additional observations were supplied.

| Area | Reported PASS checks | Count |
|---|---|---:|
| Recording and download | Recursive recording finalizes. Export becomes available. Status is clear. WAV preparation succeeds. File downloads. Filename ends in .wav. File size is positive and plausible. Independent playback works. Music matches the recording. | 9 |
| Audio fidelity | Recursive echoes, ambient harmony, enabled atmosphere and stereo positioning are preserved. No unexpected clipping or distortion. Early cut and natural tail follow the recorded policy. | 7 |
| Stability and usability | A second export succeeds. Repeat actions do not conflict. Recording and replay still work. Missing finalized input is handled. Cancellation works. Re-download works where supported. Replacement does not retain an obsolete preview. Controls are keyboard accessible. | 8 |

The developer-reported manual total across Phases 4–7 is **101 passes**. The regression suite total remains **160 passes**. The targeted closure check is separate.

## Phase 7 manual WAV verification

For repeat checks, Serve the root with `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/tests/export-demo.html` in a regular browser.

1. Start a short session, place a single root and a binary tree, and stop. Check eligibility and status, then choose Prepare WAV and Download WAV using the keyboard as well as the pointer.
2. Verify the downloaded filename, file size and independent local-player playback. Check the recorded melody, recursive echoes, ambience, atmosphere, stereo placement and absence of unexpected distortion.
3. Compare an early stop with natural completion. Verify the hard cut and expected bounded tail. Try multiple roots, overlapping roots and an ambient-only recording.
4. Prepare another WAV, try repeat actions during rendering, cancel a long render, and wait for the busy state to clear. Check replacement cleanup, re-download, and recording and replay after export. Confirm export stays unavailable before finalization.

Headless Blob generation, browser decoding and a mocked anchor request do not verify an operating-system save. Actual save and independent-player playback are verified by the separate developer report above.

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
