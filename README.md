# Cosmic Echoes

> Every star has a voice. Every echo creates a universe.

Cosmic Echoes is an interactive, space-themed procedural music application being developed for the Hub's Quest Epoch 1 solo hackathon.

## Project Concept

The application transforms recursive celestial echo propagation into relaxing musical compositions and synchronized cosmic visualizations.

Users will be able to create stars, generate recursive echoes, customize mathematical and musical parameters, and export their compositions as audio files.

## Planned Features

- Configurable recursive celestial echo generation
- Interactive cosmic visualization
- Procedural ambient music
- Harmonic musical inheritance
- Synchronized audio and visuals
- Playback and volume controls
- WAV audio export
- Accessible and responsive interface

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas 2D
- Web Audio API
- OfflineAudioContext

The application is designed to run entirely in the browser without external runtime dependencies or paid APIs.

## Development Status

The root application integrates synchronized stars and music, session recording, replay, and stereo WAV export. Phase 8 is complete within the verified root scope, with 167 prior automated passes and 47 developer-reported manual passes, including saving and independently playing a WAV. Physical mobile touch and formal accessibility verification remain open. Phase 9 adds Auto Meditation, Focus Mode and four recursion presets. Phase 9 is complete with 174 prior automated passes and 38 developer-reported manual passes. Planned feature development is complete, and Phase 10 — Final Testing and Debugging awaits authorization.

## Run locally

From the project root, run `python -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/`. Any static HTTP server works. The app starts silent.

1. Select an environment and choose **Start session**.
2. Click or tap the sky, or choose **Place center star** or **Place by coordinates**. Change recursion sliders to shape future stars.
3. Pause and resume as needed. Stop or finish to finalize the recording. **Replay** plays it again, and **Clear recording** discards it.
4. Choose **Prepare WAV**, then **Download WAV** when ready.

Monitoring volume is beside the playback controls. **Display settings** offers automatic or explicit reduced motion and visual layer toggles. Monitoring volume does not change WAV gain. See the [manual checklist](docs/TESTING.md#phase-8-manual-application-verification) and [architecture](docs/ARCHITECTURE.md#root-application).

Serve the project from the root with `python -m http.server 8000 --bind 127.0.0.1` if Python is available, then open `http://127.0.0.1:8000/tests/audio-demo.html`. Select a scenario, choose Generate composition, then press Play. Any static HTTP server can serve the page. See the [audio API](docs/ARCHITECTURE.md#procedural-audio-engine) and [test results](docs/TESTING.md).

For the visual demo, open `http://127.0.0.1:8000/tests/visuals-demo.html` with the same server. Choose a scenario, select **Load scenario**, and press **Start**. Click or tap the canvas or use the placement buttons. The demo has its own silent timeline.

Open `http://127.0.0.1:8000/tests/sync-demo.html` on the same server. Select **Start session**, place stars, then **Stop** and **Replay recording**. Start at a comfortable monitoring volume. See the [controller API](docs/ARCHITECTURE.md#synchronized-controller) and [integrated checklist](docs/TESTING.md#phase-6-manual-integrated-verification).

For export, open `http://127.0.0.1:8000/tests/export-demo.html`. Start a session, place stars, stop or wait for completion, choose **Prepare WAV**, then **Download WAV**. The WAV contains the admitted recorded notes, ambient layers, and the recording's endpoint policy. See the [export API](docs/ARCHITECTURE.md#audio-export).

Choose **Quiet Orbit** for sparse echoes, or select another recursion preset to shape future stars. While recording, **Auto Meditation** places a star every five seconds of playback time. **Focus mode** expands the sky and keeps the transport and monitoring controls available. Use **Exit focus mode** or Escape to restore the settings panel.

## AI Usage

AI-assisted development is permitted under the hackathon rules. [PROMPT_CHAIN.md](PROMPT_CHAIN.md) tracks the AI interactions and their archival status. The original prompts and responses still to be recovered are listed there.

## Event

Hub's Quest — Epoch 1

Recursive Soundscapes · Solo Hackathon

See the [hackathon requirements and deliverable map](docs/HACKATHON_REQUIREMENTS.md), [project plan](docs/PROJECT_PLAN.md), and [testing record](docs/TESTING.md).