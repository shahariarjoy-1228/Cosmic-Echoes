# Testing Record

## Status

On 2026-11-26 all three suites ran in headless Microsoft Edge over Python loopback HTTP. The browser debugger waited for final asynchronous summaries. Audio used `?live=1` and `--autoplay-policy=no-user-gesture-required`, with live test engines muted. Offline tests measured actual AudioBuffer samples.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Recursion | 32 | 0 | 0 |
| Musical mapping | 69 | 0 | 0 |
| Audio | 23 | 0 | 0 |

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

The standalone capacity helper passed exact-fit, rejection and invalid-occupancy checks. T16 and T20 remain pending for controller integration. Normal user-gesture playback, subjective listening, full application synchronization and WAV export remain pending.

## Phase 4 manual listening checklist

From the project root, run `python -m http.server 8000 --bind 127.0.0.1`. Open `http://127.0.0.1:8000/tests/audio-demo.html` in a regular browser. The automated counterpart at `/tests/audio.test.html` runs offline tests on a normal visit and skips the optional live transport group.

1. Confirm the page opens silently. Generate the default binary tree and confirm the context remains uninitialized until Play.
2. Play at low volume. Compare One root note and the binary tree. Listen for the Starlight tone, the quieter Echo voices and the parent-child melody relationship.
3. Mute and restore ambient harmony and atmosphere independently. Compare Ambient harmony only, Melody only, dry and reverberant playback.
4. Compare all three environments. Try maximum ternary and two-root scenarios and listen for harsh peaks or distracting density.
5. Try left, center and right roots. Move master volume during playback and listen for clicks or abrupt volume changes.
6. Pause and confirm the clock freezes. Resume and confirm playback continues. Stop and confirm silence, then replay.
7. Try rapid playback commands and let a composition finish naturally. Check the endpoint and control states.

**Subjective sound quality is pending.** If tuning is needed, reduce the Starlight harmonic blend or cutoff for harshness, shorten release for ringing, lower pads or reverb for muddy bass, and lower atmosphere if it masks melody. Try a lower voice cap for density or a smaller pan range for imbalance. If sliders click, inspect the smoothing on the audio clock. Record browser, output device, scenario and observations.
