# System Architecture

## Architecture Overview

Cosmic Echoes uses a modular, event-driven architecture.

```text
User interaction → Application controller → Recursive generator → Shared event timeline
```

The shared timeline drives:

- Canvas visual rendering
- Musical mapping and audio synthesis
- Offline audio export

## Module Responsibilities

| Module | Responsibility |
|---|---|
| `app.js` | Application state, initialization and controls |
| `js/recursion.js` | Generate bounded recursive celestial events |
| `js/music.js` | Convert recursive events into musical events |
| `js/audio.js` | Synthesize instruments and schedule playback |
| `js/visuals.js` | Render synchronized celestial animations |
| `js/export.js` | Render and encode downloadable WAV compositions |
| `js/presets.js` | Store environmental and musical configurations |

## Planned Event Properties

- Event ID
- Parent ID
- Root ID
- X and Y position
- Recursive depth
- Radius
- Angle
- Start time
- Duration
- Amplitude
- Child index

## Musical Mapping

- Depth determines register and softness.
- Parent notes determine harmonic relationships.
- Child indices determine melodic responses.
- Radius influences note duration.
- Decay controls amplitude.
- Horizontal position controls stereo panning.
- Event timing controls note onset.

## Synchronization

The Web Audio clock will be the authoritative playback clock.

The visual engine will use the same event timeline as the audio engine.

## Audio Export

The offline renderer will reuse the musical event data and synthesis settings to generate stereo PCM WAV files.

## Status

Proposed architecture. Implementation and verification are pending.