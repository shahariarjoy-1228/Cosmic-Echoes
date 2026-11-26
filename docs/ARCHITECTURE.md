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

## Generation and limits

Depth starts at zero for the root. Use depth 3 by default with a maximum of 4, and 2 children per star by default with a range of 1–3. At maximum branching and depth, a root contributes at most 121 events including itself. The generator produces the same events for the same inputs and never draws or plays audio.

Allow at most 300 active visual events and 8 simultaneous melodic voices across all roots. Also cap the combined pending and active recursive events at 300 across roots and apply this limit before accepting a new root. If a complete root would exceed the cap, decline that placement, tell the user capacity is full, and accept another placement once space is available. Do not queue rejected placements. Expired events release live capacity. Audio schedules only events in a short window ahead of playback and respects the shared voice limit. The composition history is kept separately from the live scheduler and bounded by the composition duration.

Validate all numeric inputs. Restore the documented default for non-finite parameter values and reject an event if a required numeric value has no default. Clamp finite values to the supported range and round integer-only parameters. The default decay is 0.65.

## Planned Event Properties

- Event ID
- Parent ID
- Root ID
- X and Y position normalized to 0–1 independently of canvas size
- Recursive depth
- Radius
- Angle
- Start time
- Duration
- Amplitude
- Child index

## Musical Mapping

The default scale is C major pentatonic (C, D, E, G, A).

- Depth determines register and softness.
- Parent notes determine harmonic relationships.
- Child indices determine melodic responses.
- Radius influences note duration.
- Decay controls amplitude.
- Horizontal position controls stereo panning.
- Event timing controls note onset.

## Synchronization

The Web Audio clock is the authoritative playback clock. Audio and visuals read the same event timeline at the same composition position. Initialize audio after a user gesture.

Tempo defaults to 55 BPM and ranges from 40 to 80 BPM. The configured generation delay defaults to 0.8 seconds at 55 BPM. Actual generation delay = configured delay × 55 ÷ selected BPM. Record the effective timings and parameter changes so already-created events retain their timing.

| Control | Planned behavior |
|---|---|
| Play | Start the current composition at time zero from a stopped state. Repeated Play while playing has no effect. |
| Pause | Freeze composition time and visuals, mute audio, and preserve the playhead. |
| Resume | Continue audio and visuals from the saved playhead without replaying earlier onsets. |
| Stop | Fade and cancel audio, clear active visuals, and return the playhead to zero while retaining the composition and settings. |
| Reset | Stop playback, clear composition events and parameter history, and restore defaults. |

## Audio Export

The composition duration defaults to 60 seconds. Preserve its scheduled events and relevant parameter changes in composition time. OfflineAudioContext renders a snapshot of that history using the same musical events, synthesis settings, ambient layers, and effects as live playback. Export uses the current composition history directly. Render up to 4 seconds of reverb tail after the composition ends.

Export stereo 16-bit PCM WAV at 44,100 Hz. Provide headroom and peak control in the shared mix to prevent clipping before PCM conversion.

## Status

Proposed architecture. Implementation and verification are pending.