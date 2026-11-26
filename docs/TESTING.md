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

Phase 6 audio-clock integration and application-level synchronization tests remain pending.

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
