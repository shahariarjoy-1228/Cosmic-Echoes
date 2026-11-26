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

Phase 4 adds standalone procedural Web Audio playback, a development listening page and bounded offline stereo rendering. Manual listening and user-gesture verification are pending. Canvas rendering, application integration and WAV export are planned. The Phase 1 transcript archive remains incomplete.

Serve the project from the root with `python -m http.server 8000 --bind 127.0.0.1` if Python is available, then open `http://127.0.0.1:8000/tests/audio-demo.html`. Select a scenario, choose Generate composition, then press Play. Any static HTTP server can serve the page. See the [audio API](docs/ARCHITECTURE.md#procedural-audio-engine) and [test results](docs/TESTING.md).

## AI Usage

AI-assisted development is permitted under the hackathon rules. [PROMPT_CHAIN.md](PROMPT_CHAIN.md) tracks the AI interactions and their archival status. The original prompts and responses still to be recovered are listed there.

## Event

Hub's Quest — Epoch 1

Recursive Soundscapes · Solo Hackathon

See the [hackathon requirements and deliverable map](docs/HACKATHON_REQUIREMENTS.md), [project plan](docs/PROJECT_PLAN.md), and [testing record](docs/TESTING.md).