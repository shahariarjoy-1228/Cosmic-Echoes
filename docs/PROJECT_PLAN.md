# Cosmic Echoes — Project Plan

## Objective

Transform a configurable recursive function into a relaxing, interactive musical experience with synchronized cosmic visuals.

## Core Algorithm

Recursive Celestial Echo Propagation.

Each root star generates smaller child echoes. The children repeat the process until the configured maximum depth is reached.

## Default Configuration

| Parameter | Default | Range |
|---|---|---|
| Recursion depth | 3 | 0–4 |
| Children per star | 2 | 1–3 |
| Decay factor | 0.65 | 0.35–0.85 |
| Spread angle | 100 degrees | 30–180 degrees |
| Configured generation delay | 0.8 seconds at 55 BPM | 0.4–2 seconds |
| Tempo | 55 BPM | 40–80 BPM |
| Maximum simultaneous melodic voices | 8 | Across all roots |
| Maximum recursive events per root | 121 | Includes the root |
| Maximum active visual events | 300 | Across all roots |
| Maximum pending and active recursive events combined | 300 | Across all roots |
| Musical scale | C major pentatonic | Default |
| Composition duration | 60 seconds | Default |

Generate events deterministically using normalized canvas coordinates. Validate numeric inputs, restore defaults for non-finite parameters or reject inputs with no default, clamp finite inputs, and round integer-only parameters. Actual delay = configured delay × 55 ÷ selected BPM. Use the Web Audio clock to synchronize playback and visuals. Keep audio and visual scheduling bounded across roots. Check the full event tree before accepting a root. If capacity is full, provide feedback and let the user try again once space is available.

Provide Play, Pause, Resume, Stop, and Reset using the [transport behavior in the architecture](ARCHITECTURE.md#synchronization). Preserve event history and relevant parameter changes. Use OfflineAudioContext to export that composition with the same live synthesis settings, musical events, ambient layers and effects as stereo 16-bit PCM WAV at 44,100 Hz, with up to 4 seconds of reverb tail and peak control to prevent clipping. Export uses the recorded event history available when the user requests it.

## Must Have

- Functional configurable recursion
- Interactive cosmic canvas
- Procedural melodic and harmonic generation
- Synchronized audio and visuals
- Ambient sound and effects
- Playback and parameter controls
- WAV export
- Accessible interface
- Complete AI prompt-response history

## Should Have

- Cosmic Meditation mode
- Constellation Harmony
- Environmental presets
- Recursion inspector

## Could Have

- Fullscreen meditation
- Breathing visualization
- Save and reload compositions
- Additional export durations

## Out of Scope

- Backend servers
- Databases
- Authentication
- Machine learning
- 3D rendering
- Realistic gravitational physics
- Paid APIs

## Development Phases

| ID | Phase | Status |
|---|---|---|
| P01 | Environment and repository setup | In progress |
| P02 | Recursive celestial engine | Pending |
| P03 | Musical mapping | Pending |
| P04 | Procedural audio engine | Pending |
| P05 | Cosmic visual engine | Pending |
| P06 | Audio-visual synchronization | Pending |
| P07 | WAV export | Pending |
| P08 | User interface and accessibility | Pending |
| P09 | Optional features and polish | Pending |
| P10 | Testing and debugging | Pending |
| P11 | Documentation and demonstration | Pending |
| P12 | Final submission | Pending |

## Success Criteria

The finished application must meet all six deliverables in the [hackathon requirements and module map](HACKATHON_REQUIREMENTS.md) and provide a coherent, relaxing musical experience without relying on external runtime services. Use the [testing plan](TESTING.md) to verify implementation. Phase 1 remains in progress until the [remaining setup checks and archival tasks](PROGRESS_LOG.md#next-task) are complete.