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

The root provides Start session, Pause, Resume, Stop, Replay and Clear recording. The controller preserves the event history and settings needed for replay and export. OfflineAudioContext renders the recorded settings, notes, ambience and effects as 44,100 Hz stereo 16-bit PCM WAV. Natural completion retains a tail of up to four seconds and early Stop cuts all layers at the endpoint. [Transport behavior](ARCHITECTURE.md#synchronization) · [WAV export](ARCHITECTURE.md#audio-export).

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

## Implemented creative features

- Auto Meditation and Focus Mode
- Three musical environments and four recursion presets
- Recursion parameter controls and event-count feedback

## Deferred concepts

- Separate Constellation Harmony mode
- Fullscreen meditation and breathing visualization
- Persistent save and reload
- Additional export durations

The release candidate feature freeze remains in effect.

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
| P02 | Recursive celestial engine | Completed (standalone) |
| P03 | Musical mapping | Completed (standalone) |
| P04 | Procedural audio engine | Completed (standalone verified) |
| P05 | Cosmic visual engine | Completed (standalone verified) |
| P06 | Audio-visual synchronization | Completed (integrated demo verified) |
| P07 | WAV export | Completed (development demo verified) |
| P08 | User interface and accessibility | Completed (root verified) |
| P09 | Creative features and polish | Completed (root verified) |
| P10 | Final testing and debugging | Completed and developer-approved (verified release candidate) |
| P11 | Documentation and demonstration | Preparation complete and developer-approved; rehearsal and archive recovery pending |
| P12 | Final submission | Next planned, pending explicit authorization |

## Success Criteria

The finished application must meet all six deliverables in the [hackathon requirements and module map](HACKATHON_REQUIREMENTS.md) and provide a coherent, relaxing musical experience without relying on external runtime services. Use the [testing plan](TESTING.md) to verify implementation. Phase 1 archive work remains open. The root app integrates the [recursive engine](ARCHITECTURE.md#recursive-engine-api) and [musical mapper](ARCHITECTURE.md#musical-mapping). Phase 10 accepted the six product deliverables within scope. Phase 11 preparation is complete and developer-approved within scope. Demonstration rehearsal is pending, and judging criteria await verification against the original rules PDF. Full submission compliance depends on [original AI transcript recovery](AI_USAGE.md).