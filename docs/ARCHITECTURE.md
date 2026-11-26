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

## Recursive engine API

| Export | Purpose |
|---|---|
| `DEFAULT_CONFIG` | Frozen defaults for `maxDepth`, `childrenPerStar`, `decay`, `spreadAngle` (degrees), `generationDelay` (seconds at 55 BPM), and `tempo`. |
| `MAX_EVENTS_PER_ROOT`, `GLOBAL_EVENT_BUDGET` | Limits of 121 per root and 300 pending plus active events across roots. |
| `validateConfig(config)` | Return a new validated configuration. Finite values are clamped, depth and branching are rounded first, and missing or non-finite values use defaults. |
| `countEvents(maxDepth, childrenPerStar)` | Count a whole tree using the same validation as generation. |
| `canFitTree(config, pendingAndActiveCount)` | Check whether the whole tree fits. Invalid counts and insufficient capacity return false. |
| `generateEchoTree({ id, x, y, amplitude }, config, startTime = 0)` | Return one complete tree as an array of plain objects. A blank or nonstring ID and missing or non-finite coordinates throw a TypeError. |

The future controller must call `canFitTree` with its current combined count before generating and accepting a placement. Give each accepted root a distinct string ID. The controller will own capacity tracking and release. The generator enforces its own per-root cap.

## Event contract

Each call writes the parent first, then visits its children recursively by ascending child index. The base case returns immediately after writing an event at the maximum depth. The recursive case offsets each child from the parent along its propagation angle by one parent radius, clamps each coordinate to 0–1 at the edges, and multiplies radius, duration, and amplitude by decay. A single child follows the parent angle. Multiple children are evenly spaced across the configured spread. Siblings start together one generation delay after the parent. The output uses depth-first order, so consumers that need chronological order should sort by start time.

The root points up at −π/2 radians and starts with radius 0.12 and duration 1.2 seconds. Root amplitude defaults to 1 and is clamped to 0–1. Root coordinates are clamped to 0–1. Start time defaults to zero, including for non-finite inputs, and finite negatives clamp to zero. A time too large to represent successive delays throws a RangeError. Duration is independent of tempo and generation delay.

With depth *d* and branching factor *b*, the tree contains 1 + b + … + bᵈ events, or d + 1 for one child per star. Counting takes O(d) time and constant auxiliary space. Generation visits N events, uses O(d + 1) stack frames, and copies and encodes each path. Including those paths, it takes O(N × (d + 1)) time and output space for a fixed-length root ID. Depth is capped at four.

| Fields | Meaning |
|---|---|
| `id`, `rootId`, `parentId` | Event ID is a JSON-encoded array of root ID and zero-based child path, such as `["star",0]`. The root's parent ID is `null`. |
| `x`, `y`, `depth` | Normalized coordinates and integer depth starting at zero. |
| `radius`, `angle` | Positive normalized radius and propagation direction in radians. |
| `startTime`, `duration` | Start time and positive duration in seconds. |
| `amplitude`, `childIndex` | Relative amplitude from 0 to 1 and zero-based child index, or `null` at the root. |

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

The recursive engine is implemented and its standalone browser tests passed. Application integration, playback, rendering and export are planned.