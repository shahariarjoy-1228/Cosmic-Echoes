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

Phase 4 adds standalone procedural Web Audio playback, a development listening page and bounded offline stereo rendering. Standalone verification is complete with 124 previously passed automated tests and 20 developer-reported manual checks. Phase 5 delivers a standalone Canvas 2D visual engine and demo. Its verification includes 139 previously passed automated tests across all suites and 29 developer-reported manual visual checks. Phase 6 connects audio and visuals in a standalone synchronized demo, with live placement, recording and replay. Phase 6 verification includes 147 prior automated passes and 28 developer-reported manual passes. Phase 7 — WAV Export System is next and awaits authorization. Final application controls and WAV export are planned. The Phase 1 transcript archive remains incomplete.

Serve the project from the root with `python -m http.server 8000 --bind 127.0.0.1` if Python is available, then open `http://127.0.0.1:8000/tests/audio-demo.html`. Select a scenario, choose Generate composition, then press Play. Any static HTTP server can serve the page. See the [audio API](docs/ARCHITECTURE.md#procedural-audio-engine) and [test results](docs/TESTING.md).

For the visual demo, open `http://127.0.0.1:8000/tests/visuals-demo.html` with the same server. Choose a scenario, select **Load scenario**, and press **Start**. Click or tap the canvas or use the placement buttons. The demo has its own silent timeline.

Open `http://127.0.0.1:8000/tests/sync-demo.html` on the same server. Select **Start session**, place stars, then **Stop** and **Replay recording**. Start at a comfortable monitoring volume. See the [controller API](docs/ARCHITECTURE.md#synchronized-controller) and [integrated checklist](docs/TESTING.md#phase-6-manual-integrated-verification).

## AI Usage

AI-assisted development is permitted under the hackathon rules. [PROMPT_CHAIN.md](PROMPT_CHAIN.md) tracks the AI interactions and their archival status. The original prompts and responses still to be recovered are listed there.

## Event

Hub's Quest — Epoch 1

Recursive Soundscapes · Solo Hackathon

See the [hackathon requirements and deliverable map](docs/HACKATHON_REQUIREMENTS.md), [project plan](docs/PROJECT_PLAN.md), and [testing record](docs/TESTING.md).