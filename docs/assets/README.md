# Demonstration evidence

Captured from the locally served root application on the unchanged Phase 10 code at `9c0e64a`, using headless Microsoft Edge 158.0.4370.33 with DPR 1. The Windows host served the app over loopback HTTP. Desktop captures use 1440 × 1040 CSS px and the narrow capture uses an emulated 390 × 844 CSS px viewport.

| Capture | Application state |
|---|---|
| [Home](screenshots/cosmic-echoes-home.png) | Initial Deep Space controls and sky |
| [Nebula Dreams](screenshots/nebula-dreams-session.png) | Paused active composition, three Nebula Bloom roots and 120 accepted events |
| [Focus Mode](screenshots/focus-mode.png) | Expanded sky and retained transport controls |
| [Export](screenshots/recording-export.png) | Finalized recording with WAV prepared for download |
| [Narrow layout](screenshots/narrow-layout.png) | Root interface at an emulated narrow viewport |

These captures document visible states. Physical touch, frame rate, assistive technology behavior and visual parity across browsers remain unverified.

## Quiet Orbit WAV

[Download the generated sample](audio/quiet-orbit-sample.wav). An export of three Deep Space / Quiet Orbit roots placed at approximately 0, 3 and 6 composition seconds, with nine celestial events and nine admitted melody notes. The reproduction used a 12-second natural session, followed by the calculated tail. The root's normal session limit is 60 seconds. The browser decoded the exported WAV and the binary was independently checked.

| Field | Actual value |
|---|---:|
| Composition endpoint | 12 s |
| Rendered duration | 15.1 s |
| Format | 44,100 Hz, stereo, 16-bit PCM |
| Frames | 665,910 |
| PCM data | 2,663,640 bytes |
| WAV file | 2,663,684 bytes |
| Clipped samples | 0 |

SHA-256 `8ed563d9f19fd52201f140d103577fc283ea191462155eaa593dfffd634f885f`.

The browser ran with an autoplay override and the live monitor muted for capture. The offline exporter rendered the recorded mix. No fresh independent-player listening check was performed on this specific sample. See the [Phase 10 evidence](../TESTING.md#phase-10-automated-qa) for previously verified user-gesture playback and export.
