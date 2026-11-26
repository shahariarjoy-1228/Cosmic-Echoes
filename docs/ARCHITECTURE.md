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

The standalone `js/music.js` module reads the recursive engine's event IDs and timing and produces JSON-serializable instructions.

| Scale ID | Notes | Environment |
|---|---|---|
| `c-major-pentatonic` | C, D, E, G, A | Deep Space (default) |
| `a-minor-pentatonic` | A, C, D, E, G | Nebula Dreams |
| `f-major-pentatonic` | F, G, A, C, D | Solar Harmony |

### Musical mapping API

| Export | Contract |
|---|---|
| `DEFAULT_MUSIC_CONFIG`, `MUSICAL_SCALES` | Frozen defaults and scale registry. Each scale defines a tonic pitch class, frozen intervals in semitones, and an environment name. |
| `validateMusicConfig(config)` | Returns fresh `scaleId`, `minMidi`, `maxMidi`, `maxIntensity`, and `panLimit` settings. Missing or non-finite numeric settings default. MIDI settings round and clamp to 0–127. Intensity and pan limits clamp to 0–0.70 and 0–0.65 respectively. Unknown scales and ranges with no valid pitches throw RangeError. |
| `isValidScaleId(id)`, `getScale(id)` | Test a scale ID or retrieve its frozen definition. An omitted lookup ID selects the default. |
| `buildScaleNotes(scaleId, minMidi = 48, maxMidi = 79)`, `isNoteInScale(note, scaleId)` | Build ascending pitches or test scale membership. The scale defaults to C major pentatonic. Explicit MIDI values must be integers from 0 to 127. Empty or reversed ranges throw RangeError. |
| `midiToFrequency(note)`, `midiToNoteName(note)` | Convert MIDI to Hz using equal temperament with MIDI 69 at 440 Hz, or to a readable name using MIDI 60 as C4. |
| `mapCelestialEventsToMusic(events, config)` | Return raw melody and echo notes, with up to 300 input events per batch and 121 per root. Empty input yields an empty array with valid configuration. |
| `generateAmbientHarmony(config, startTime = 0, duration = 60)` | Return a sustained tonic and fifth on the requested composition timeline, in seconds. |
| `planMelodicVoices(notes, voiceLimit = 8)` | Return `{ retained, suppressed }` from up to 300 melody and echo notes. Notes are returned by reference. Inputs are never mutated. |

### Inheritance and timing

Root pitch uses a position within the middle half of the ascending scale-note list. The index is the rounded result of `(0.25 + 0.5 × (x + 1 − y) / 2) × (numberOfPitches − 1)`. Bottom-left positions favor lower notes and top-right positions favor higher notes.

At odd depths, child indices 0, 1, and 2 request +2, −2, and 0 scale steps from the parent's pitch. At even depths the directions reverse. Two steps often give a third or fourth. At a range edge, move as far as available. If the result exceeds seven semitones, step back toward the parent until it fits. Narrow ranges can yield repeated notes.

The mapper validates geometry, depth, IDs, timing, durations, amplitudes and roots. It processes lower depths first, including for shuffled input. Duplicate event IDs or roots, missing parents, cross-root links, mismatched depths and early child onsets are rejected. Output sorts by onset, then depth, then lexical musical ID. Onsets preserve the original celestial seconds. Recursion already applied tempo.

Musical duration is `celestialDuration × (1 + min(radius, 1)) ÷ (1 + 0.15 × depth)`, clamped to 0.4–3 seconds. Relative intensity equals celestial amplitude times the configured maximum, which defaults to 0.70. Pan is `(2 × x − 1) × panLimit`, with a default limit of 0.65 on either side.

### Musical events and ambient harmony

Each event has `id`, `celestialEventId`, `rootId`, `parentMusicalEventId`, `depth`, `midiNote`, `noteName`, `frequency` in Hz, `startTime` and `duration` in seconds, `intensity`, `pan`, `instrument`, and `role`. Melodic IDs are JSON-encoded pairs of the string "note" and the celestial ID. Roots use instrument `starlight` and role `melody`, with a null musical parent. Children use `echo` for both.

Ambient events use instrument `nebula-pad` and role `ambient`. Celestial, root, parent and depth references are null. The tonic is MIDI 36 plus its pitch class, and the fifth is seven semitones higher. Both have intensity 0.12 and centered pan. Ambient register is independent of the melody range. Start time defaults to zero when missing or non-finite, and finite negative starts clamp to zero. Duration defaults to 60 seconds and clamps to 0.4–60 seconds. An onset too large to represent its duration is rejected. The controller should request one layer per composition and manage its lifecycle and crossfades.

### Voice planning and integration

The planner sorts by onset, depth and ID. It counts voices over half-open intervals `[startTime, startTime + duration)`. Roots and then shallower notes get first access at simultaneous onsets. Already sounding notes keep their slots. Silent and excess notes appear in `suppressed` with unchanged onsets and references. Finite limits round and clamp to 1–8 and non-finite limits default to eight. The planner rejects malformed intervals and duplicate or non-melodic inputs. Ambient and visual events stay separate from this budget.

The standalone audio engine consumes raw mapped notes and applies its own release-aware capacity check. The musical planner is still available for comparing nominal note intervals.

## Procedural Audio Engine

`js/audio.js` defers live context creation until a caller explicitly invokes `initialize()` or `play()` from a user gesture. Both live and offline paths use the same node graph, synthesis and interval accounting. They preserve mapper pitches, IDs and composition-relative onsets.

| Instrument | Source and filter | Peak coefficient × intensity | Attack | Release after note interval |
|---|---|---:|---:|---:|
| Starlight | Sine fundamental, 9% second harmonic below Nyquist, 2300 Hz low-pass | 0.075 | 55 ms | 220 ms |
| Echo | Sine, 1700 Hz low-pass | 0.052 | 35 ms | 160 ms |
| Nebula pad | Sine, 950 Hz low-pass | 0.105 | 1.1 s | 600 ms |

Envelopes ramp up from zero, decay toward a lower sustain, then ramp to zero before the sources finish. Short intervals shorten the attack. StereoPannerNode uses the mapped pan when available. The fallback sends the filtered mono signal to the bus, centered in the stereo output.

Melodic, pad and atmosphere buses feed direct gain `1 − mix` and one shared stereo convolver whose return gain is `0.65 × mix`. Both paths sum into a 2:1 compressor at −14 dB and then master gain. The compressor provides gentle peak control. Default master is 0.30, pad bus 0.55, reverb mix 0.20 and atmosphere bus 0.25. Sliders settle to their target within 85 ms of audio time. Dry mode sets the convolver return to zero.

A seeded integer PRNG supplies a two-second loop with tapered edges, a 360 Hz band-pass and fades up to 0.8 seconds. The atmosphere envelope peaks at 0.055 before its bus. One source runs per composition when enabled. Reverb uses an independent seeded stereo buffer with damped low-frequency content and cubic decay. Its default length is 2.5 seconds and maximum is 4 seconds. Each context caches its latest buffer of each kind. Matching seeds and sample rates yield matching input buffers. Context sample rate changes buffer length and sample sequence at a given time.

### Audio API

| Export | Contract |
|---|---|
| `DEFAULT_AUDIO_CONFIG`, `validateAudioConfig(config)` | Frozen defaults and a fresh bounded configuration. Master, reverb mix and layer controls range from 0 to 1. Voice cap is 1–8, polling 10–50 ms, horizon 0.08–0.25 s, impulse 0.1–4 s, and offline rate 22,050–48,000 Hz. Non-finite numbers default. Atmosphere enablement requires a boolean. Seed is an unsigned 32-bit integer. |
| `createAudioGraph(context, destination = context.destination, config)` | Construct buses, shared reverb, dynamics and master output. The returned graph has `disconnect()`. |
| `createSeededNoiseBuffer(context, duration = 2, seed)`, `createReverbImpulseResponse(context, duration = 2.5, seed)` | Return mono noise and stereo impulse buffers, with lengths bounded to 0.1–4 seconds. Both default to seed 1729. |
| `scheduleInstrumentVoice(context, destination, note, when, duration = note.duration, onEnd)` | Schedule a validated event at absolute audio-clock seconds. The handle has `stop()`. Completion disconnects all voice nodes and invokes the optional callback. |
| `renderCompositionOffline(composition, config)` | Resolve to a stereo AudioBuffer, using 44,100 Hz by default. |
| `new AudioEngine(config)` | Construct an idle live engine. Context creation is deferred. |

`loadComposition({ notes = [], ambient = [], duration = 60 })` validates and copies up to 300 melodic notes and two pads with unique IDs, replacing playback. Duration must be 0.05–60 seconds. Invalid events or layer assignments throw. Events at or beyond the endpoint are declined. An overlapping nominal note interval is shortened to the endpoint, then receives its instrument release. Both paths allow `min(4, 0.6 + reverbDuration)` seconds after the endpoint. Offline frame count rounds up. The buffer contains synthesis, with encoding reserved for Phase 7.

`initialize()`, `play()`, `pause()`, `resume()` and `dispose()` are async. Invoke live initialization or playback in a user gesture. `play()` starts from zero and ignores repeat calls while playing or paused. Pause suspends the dedicated context and stops polling. Resume uses the same graph and previously scheduled notes. `stop()` cancels sources, disconnects the old graph and zeros the playhead while retaining the loaded composition. Natural completion leaves the playhead at the endpoint after the allowed tail. `reset()` clears the composition and keeps mix settings. `dispose()` clears and closes the context and is idempotent. Stop and disposal invalidate pending transport operations.

`setMasterVolume(value)`, `setReverbMix(value)`, `setAmbientVolume(value)`, and `setAtmosphereVolume(value)` update the current and next graph settings. `getState()`, `getDuration()`, `getPlaybackPosition()`, and `getDiagnostics()` expose state, duration, clamped seconds and numeric/suppression diagnostics. States are idle, playing, paused, stopped and disposed. The composition-relative position derives from AudioContext.currentTime and stays stable while paused.

Live scheduling starts with 35 ms lead, polls every 25 ms and looks ahead 100 ms by default. Notes up to 20 ms late start at the current clock time. Older notes are suppressed. Equal onsets are ordered by depth and ID. The registry counts intersecting intervals including release and already reserved starts. It allows at most eight melodic voices, two pads and one atmosphere source. Sources use at most two oscillators per logical voice. Already sounding voices retain their slots. Suppression records contain musical ID, celestial ID and reason. Offline schedules in one pass without live timer lateness. The future controller owns live additions and ambient replacement or crossfades.

## Cosmic Visual Engine

`js/visuals.js` renders the existing recursion events on a caller-owned Canvas 2D element. Importing the module has no DOM effects. The constructor initializes the supplied canvas and installs resize and motion-preference listeners. The canvas should have CSS-defined display dimensions independent of its backing-store attributes.

| Theme ID | Palette | Future musical association |
|---|---|---|
| `deep-space` | Navy, indigo, pale blue | C major pentatonic |
| `nebula-dreams` | Violet, lavender, soft pink | A minor pentatonic |
| `solar-harmony` | Charcoal, gold, cream | F major pentatonic |

The registry and defaults are frozen. Theme selection only changes the palette. Default effects are particles, glow, ripples and connections enabled, with standard quality, automatic motion, and 100 seeded particles. Particle count clamps to 0–200, seed to an unsigned 32-bit integer, configured DPR cap to 1–2. Missing and non-finite optional numeric settings use defaults. Unknown themes, motion modes and quality settings throw.

### Visual API

| Signature | Behavior |
|---|---|
| `DEFAULT_VISUAL_CONFIG`, `VISUAL_THEMES`, `validateVisualConfig(config)` | Defaults, palette registry, and a fresh validated configuration. |
| `normalizedToCanvas(x, y, width, height)`, `canvasToNormalized(x, y, width, height)` | Convert between normalized units and logical CSS pixels. Clamp out-of-bounds values. Inverse conversion returns null for a zero-size canvas. Invalid or non-finite numbers throw. |
| `pointerToNormalized(canvas, clientX, clientY)` | Subtract the canvas client rectangle offset and convert in CSS pixels, independent of DPR. |
| `getEventVisualState(event, time)` | Return `{ status, age, progress }` from composition seconds. Age can be negative and progress is clamped. Invalid lifetimes or times throw. |
| `getVisualMetrics(event, progress, shortestSide, reducedMotion = false)` | Derive radius, opacity, ripple radius and ripple opacity for a validated event and logical pixel size. |
| `new VisualEngine(canvas, config)` | Initialize a 2D renderer. Invalid arguments or an unavailable 2D context throw. |

`addEvents(batch)` accepts complete new root trees, returns their event count, and copies incoming records. IDs, coordinates, lifetimes, depth, amplitude and parent relationships must be valid. The mapper and renderer use the same celestial IDs and onset seconds. Duplicate IDs, roots or sibling indices, cross-tree parents, early child onsets, expired events, and oversized batches are rejected before any storage changes.

`renderAt(seconds)` uses supplied finite nonnegative time and draws the scene, even while paused. Each event is active in `[startTime, startTime + duration)`, pending before onset and expired at the endpoint. There is no visual tail or extra tempo scaling. Age equals time minus onset and normalized progress equals age divided by duration. Expired records are pruned. Backward time reevaluates retained events only, so a seek or replay that needs expired scenes must reset and re-submit original trees. The demo reset clears all events and returns to zero.

`start(timeProvider)` starts one animation loop and ignores duplicate starts. `pause()` cancels its frame and retains the provider. `resume()` reuses that provider. Its owner must freeze its clock during playback pause. `stop()` cancels the frame and drops the provider, leaving the scene at its last position. `resize()` redraws at the current position. `clear()` removes all events without changing time or theme. `reset()` stops, clears, and returns to zero. `dispose()` is idempotent and cancels frames, detaches observers and listeners, and releases storage and rendering references.

`setTheme(id)`, `setReducedMotion("auto" | "full" | "reduced")`, `setQuality("standard" | "reduced")`, `setParticlesEnabled(boolean)`, `setRipplesEnabled(boolean)` and `setConnectionsEnabled(boolean)` redraw at the same time. Automatic motion follows the system preference. Reduced motion freezes background drift and disables expanding rings while preserving fades, onsets and links. Reduced quality draws fewer particles and omits glow sprites. `getDiagnostics()` returns state, seconds, event counts, roots, retained parent positions, canvas size, effective DPR, approximate smoothed FPS and error text.

### Rendering, resizing and capacity

ResizeObserver and the window resize event measure CSS bounds. Backing-store pixel dimensions use effective DPR, capped by 2, 4096 pixels per side and 8 million total pixels. Hidden canvases use a 1×1 buffer. A fresh transform maps CSS pixels to the backing store. Normalized locations scale with width and height, while circular radii use the shorter side.

Star radius is `clamp(event.radius × shortestSide × 0.32, 0.65, 44)` CSS pixels. Opacity uses smoothstep attack through 14% progress, fade after 55%, square-root amplitude and depth attenuation. A cached radial sprite supplies the inner and outer glow and a small separate disk supplies the core. One thin ring expands from the star radius toward five times that radius using `1 + 4 × (1 − (1 − progress)²)`. Ring opacity is star opacity times `0.44 × (1 − progress)`. It shares the star fade and lifetime.

The background uses a cached radial gradient and a bounded, seeded field of tiny points. Drift is a gentle time-derived horizontal offset. Parent-child strokes appear only while the child is active, fade with its opacity and dim with depth. A map supplies live parent positions. Expired parents keep position only while a remaining child refers to them. Completed root metadata is removed, and the retained parent map can contain at most one entry per pending or active event. The visible event list and lookup sets are reused across frames.

The renderer enforces 121 events per root and 300 pending plus active events total. The demo uses recursion's count and capacity helpers before generating complete trees with unique root IDs. It stamps placements with demo time, including zero before Start and the frozen time while paused. Rejected placements are reported and never queued. Clear Universe keeps the clock and visual settings. The future controller owns application-wide capacity and any replay history.

Phase 6 can call `renderer.renderAt(audioEngine.getPlaybackPosition())` or use `renderer.start(() => audioEngine.getPlaybackPosition())` with transport coordination. The Phase 5 demo uses a separate `performance.now()` clock and does not import audio.

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

Recursion, musical mapping and procedural audio are implemented as standalone modules. The development listening page exercises the audio engine. Standalone audio verification is complete, including developer-reported listening checks. The standalone visual engine and demo are implemented. Standalone visual verification includes developer-reported desktop checks. Mobile and touch verification, application integration, synchronization and WAV export remain pending.