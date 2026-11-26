import { GLOBAL_EVENT_BUDGET } from "./recursion.js";

export const DEFAULT_AUDIO_CONFIG = Object.freeze({
  masterVolume: 0.30, maxMelodicVoices: 8, schedulerInterval: 25, schedulingHorizon: 0.10,
  reverbMix: 0.20, reverbDuration: 2.5, ambientVolume: 0.55,
  atmosphereEnabled: true, atmosphereVolume: 0.25, seed: 1729, sampleRate: 44100,
});

const MAX_DURATION = 60;
const PAD_LIMIT = 2;
const LEAD = 0.035;
const LATE_TOLERANCE = 0.02;
const buffers = new WeakMap();
const instruments = {
  starlight: { role: "melody", gain: 0.075, attack: 0.055, release: 0.22, sustain: 0.30, cutoff: 2300, harmonic: 0.09 },
  echo: { role: "echo", gain: 0.052, attack: 0.035, release: 0.16, sustain: 0.22, cutoff: 1700, harmonic: 0 },
  "nebula-pad": { role: "ambient", gain: 0.105, attack: 1.1, release: 0.60, sustain: 0.83, cutoff: 950, harmonic: 0 },
};

function between(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function bounded(value, fallback, min, max) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function validateAudioConfig(input = {}) {
  const defaults = DEFAULT_AUDIO_CONFIG;
  const settings = input ?? {};
  return {
    masterVolume: bounded(settings.masterVolume, defaults.masterVolume, 0, 1),
    maxMelodicVoices: Math.round(bounded(settings.maxMelodicVoices, defaults.maxMelodicVoices, 1, 8)),
    schedulerInterval: Math.round(bounded(settings.schedulerInterval, defaults.schedulerInterval, 10, 50)),
    schedulingHorizon: bounded(settings.schedulingHorizon, defaults.schedulingHorizon, 0.08, 0.25),
    reverbMix: bounded(settings.reverbMix, defaults.reverbMix, 0, 1),
    reverbDuration: bounded(settings.reverbDuration, defaults.reverbDuration, 0.1, 4),
    ambientVolume: bounded(settings.ambientVolume, defaults.ambientVolume, 0, 1),
    atmosphereEnabled: typeof settings.atmosphereEnabled === "boolean" ? settings.atmosphereEnabled : defaults.atmosphereEnabled,
    atmosphereVolume: bounded(settings.atmosphereVolume, defaults.atmosphereVolume, 0, 1),
    seed: Math.round(bounded(settings.seed, defaults.seed, 0, 0xffffffff)),
    sampleRate: Math.round(bounded(settings.sampleRate, defaults.sampleRate, 22050, 48000)),
  };
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296 * 2 - 1;
  };
}

export function createSeededNoiseBuffer(context, duration = 2, seed = DEFAULT_AUDIO_CONFIG.seed) {
  const length = Math.max(1, Math.floor(context.sampleRate * bounded(duration, 2, 0.1, 4)));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const random = seededRandom(seed);
  // Fade both ends to zero so the loop never jumps between unrelated samples.
  const fade = Math.min(length / 2, context.sampleRate * 0.035);
  for (let i = 1; i < length - 1; i += 1) {
    samples[i] = random() * Math.min(1, i / fade, (length - 1 - i) / fade);
  }
  return buffer;
}

export function createReverbImpulseResponse(context, duration = 2.5, seed = DEFAULT_AUDIO_CONFIG.seed) {
  const length = Math.max(1, Math.floor(context.sampleRate * bounded(duration, 2.5, 0.1, 4)));
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const random = seededRandom(seed);
  for (let channel = 0; channel < 2; channel += 1) {
    const samples = buffer.getChannelData(channel);
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      const sample = random();
      samples[i] = (sample - previous * 0.65) * 0.35 * (1 - i / length) ** 3;
      previous = sample;
    }
  }
  return buffer;
}

function cachedBuffer(context, key, create) {
  if (!buffers.has(context)) buffers.set(context, new Map());
  const cache = buffers.get(context);
  // Keep only the most recent buffer of each kind for this context.
  const kind = key.split(":")[0];
  if (cache.get(kind)?.key !== key) cache.set(kind, { key, buffer: create() });
  return cache.get(kind).buffer;
}

export function createAudioGraph(context, destination = context.destination, config) {
  const settings = validateAudioConfig(config);
  const gain = (value) => {
    const node = context.createGain();
    node.gain.value = value;
    return node;
  };
  const melodic = gain(1);
  const ambient = gain(settings.ambientVolume);
  const atmosphere = gain(settings.atmosphereVolume);
  const dry = gain(1 - settings.reverbMix);
  const wet = gain(settings.reverbMix * 0.65);
  const convolver = context.createConvolver();
  convolver.buffer = cachedBuffer(context, `reverb:${settings.reverbDuration}:${settings.seed}`,
    () => createReverbImpulseResponse(context, settings.reverbDuration, settings.seed));
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 2;
  const master = gain(settings.masterVolume);
  for (const bus of [melodic, ambient, atmosphere]) {
    bus.connect(dry);
    bus.connect(convolver);
  }
  convolver.connect(wet);
  dry.connect(compressor);
  wet.connect(compressor);
  compressor.connect(master);
  const endpoint = gain(1);
  master.connect(endpoint);
  endpoint.connect(destination);
  return {
    melodic, ambient, atmosphere, dry, wet, master, endpoint,
    disconnect() {
      for (const node of [melodic, ambient, atmosphere, dry, wet, convolver, compressor, master, endpoint]) node.disconnect();
    },
  };
}

function requireNote(note) {
  const preset = note && Object.hasOwn(instruments, note.instrument) && instruments[note.instrument];
  if (!preset || preset.role !== note.role || typeof note.id !== "string" || !note.id.trim() ||
      !between(note.frequency, 8, 13000) || !Number.isInteger(note.midiNote) || !between(note.midiNote, 0, 127) ||
      !Number.isFinite(note.startTime) || note.startTime < 0 || !between(note.duration, 0.4, note.role === "ambient" ? 60 : 3) ||
      !between(note.pan, -1, 1) || !between(note.intensity, 0, 0.7) ||
      (note.role !== "ambient" && (!Number.isInteger(note.depth) || !between(note.depth, 0, 4)))) {
    throw new TypeError("Invalid musical event. Use a supported instrument and finite mapper values.");
  }
  return preset;
}

function sourceHandle(sources, nodes, start, end, onEnd) {
  let done = false;
  function cleanup() {
    if (done) return;
    done = true;
    for (const node of [...sources, ...nodes]) node.disconnect();
    onEnd?.();
  }
  sources[0].onended = cleanup;
  for (const source of sources) {
    source.start(start);
    source.stop(end);
  }
  return {
    stop() {
      if (done) return;
      for (const source of sources) source.stop();
      cleanup();
    },
  };
}

export function scheduleInstrumentVoice(context, destination, note, when, duration = note.duration, onEnd) {
  const preset = requireNote(note);
  if (!Number.isFinite(when) || when < 0 || !between(duration, Number.EPSILON, note.duration)) {
    throw new RangeError("Invalid scheduled voice interval.");
  }
  const end = when + duration + preset.release;
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = preset.cutoff;
  filter.Q.value = 0.15;
  envelope.connect(filter);
  const nodes = [envelope, filter];
  if (typeof context.createStereoPanner === "function") {
    const panner = context.createStereoPanner();
    panner.pan.value = note.pan;
    filter.connect(panner);
    panner.connect(destination);
    nodes.push(panner);
  } else {
    filter.connect(destination);
  }

  const peak = note.intensity * preset.gain;
  const attack = Math.min(duration * 0.45, preset.attack);
  const sustain = peak * preset.sustain;
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(peak, when + attack);
  envelope.gain.linearRampToValueAtTime(sustain, when + Math.min(duration, attack + (duration - attack) * 0.65));
  envelope.gain.setValueAtTime(sustain, when + duration);
  envelope.gain.linearRampToValueAtTime(0, end);

  const fundamental = context.createOscillator();
  fundamental.frequency.value = note.frequency;
  fundamental.connect(envelope);
  const sources = [fundamental];
  if (preset.harmonic && note.frequency * 2 < context.sampleRate / 2) {
    const harmonic = context.createOscillator();
    const blend = context.createGain();
    harmonic.frequency.value = note.frequency * 2;
    blend.gain.value = preset.harmonic;
    harmonic.connect(blend);
    blend.connect(envelope);
    sources.push(harmonic);
    nodes.push(blend);
  }
  return sourceHandle(sources, nodes, when, end, onEnd);
}

function startAtmosphere(context, destination, settings, start, duration, onEnd) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = cachedBuffer(context, `noise:${settings.seed}`,
    () => createSeededNoiseBuffer(context, 2, settings.seed));
  source.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 360;
  filter.Q.value = 0.65;
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(destination);
  const fade = Math.min(0.8, duration / 2);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(0.055, start + fade);
  envelope.gain.setValueAtTime(0.055, start + duration - fade);
  envelope.gain.linearRampToValueAtTime(0, start + duration);
  return sourceHandle([source], [filter, envelope], start, start + duration, onEnd);
}

function prepareComposition({ notes = [], ambient = [], duration = MAX_DURATION, hardEnd = false, layerDuration = duration, fixedPlayback = false } = {}) {
  if (!between(duration, hardEnd ? 0.000001 : 0.05, MAX_DURATION) || !between(layerDuration, duration, MAX_DURATION)) {
    throw new RangeError("Invalid bounded composition duration.");
  }
  if (!Array.isArray(notes) || !Array.isArray(ambient) || notes.length > GLOBAL_EVENT_BUDGET || ambient.length > PAD_LIMIT) {
    throw new RangeError("Use at most 300 melodic and two ambient events per composition.");
  }
  const ids = new Set();
  function copy(event, isAmbient) {
    requireNote(event);
    if ((event.role === "ambient") !== isAmbient || ids.has(event.id)) {
      throw new TypeError("Musical events must have unique IDs and use the correct layer.");
    }
    ids.add(event.id);
    return { ...event };
  }
  const events = [...Array.from(notes, (event) => copy(event, false)),
    ...Array.from(ambient, (event) => copy(event, true))];
  events.sort(compareNotes);
  return { events, duration, hardEnd: hardEnd === true, layerDuration, fixedPlayback: fixedPlayback === true };
}

function compareNotes(a, b) {
  return a.startTime - b.startTime || (a.depth ?? 0) - (b.depth ?? 0) ||
    (a.id < b.id ? -1 : Number(a.id > b.id));
}

// This same scheduler is fed incrementally in live playback and in one pass offline.
function createSchedule(context, graph, composition, settings, origin) {
  const voices = new Map();
  const suppressed = [];
  const admitted = [];
  const ids = new Set(composition.events.map(({ id }) => id));
  const ambientCount = composition.events.filter(note => note.role === "ambient").length;
  let queue = [...composition.events];
  let index = 0;
  let peak = 0;
  let retainedMelodic = 0;
  let atmosphere = settings.atmosphereEnabled
    ? startAtmosphere(context, graph.atmosphere, settings, origin, composition.layerDuration, () => { atmosphere = null; })
    : null;

  return {
    append(notes) {
      if (!Array.isArray(notes) || ids.size - ambientCount + notes.length > GLOBAL_EVENT_BUDGET) {
        throw new RangeError("Live note capacity exceeded.");
      }
      const additions = new Map();
      for (const note of notes) {
        requireNote(note);
        if (note.role === "ambient" || ids.has(note.id) || additions.has(note.id) ||
            origin + note.startTime <= context.currentTime || note.startTime >= composition.duration) {
          throw new RangeError("Live notes must have unique IDs and future onsets inside the session.");
        }
        additions.set(note.id, { ...note });
      }
      // A synchronous placement can undo this insertion before the next polling tick.
      queue = [...queue.slice(index), ...additions.values()].sort(compareNotes);
      index = 0;
      for (const id of additions.keys()) ids.add(id);
      let rolledBack = false;
      return () => {
        if (rolledBack || queue.slice(0, index).some(note => additions.has(note.id)) ||
            admitted.some(note => additions.has(note.id)) || suppressed.some(note => additions.has(note.id))) return false;
        rolledBack = true;
        queue = queue.slice(index).filter(note => !additions.has(note.id));
        index = 0;
        for (const id of additions.keys()) ids.delete(id);
        return true;
      };
    },
    fill(horizon, live = false) {
      while (index < queue.length) {
        const note = queue[index];
        const desired = origin + note.startTime;
        if (desired > horizon) break;
        index += 1;
        let reason;
        const isPad = note.role === "ambient";
        const now = live ? context.currentTime : 0;
        const start = Math.max(now, desired);
        const duration = Math.min(note.duration, origin + composition.layerDuration - start);
        const end = start + duration + instruments[note.instrument].release;
        const overlaps = [...voices.values()].filter((voice) =>
          voice.isPad === isPad && voice.start < end && start < voice.end).length;
        if (note.startTime >= composition.duration || duration < Number.EPSILON) reason = "outside-composition";
        else if (!note.intensity) reason = "silent";
        else if (now - desired > LATE_TOLERANCE) reason = "late";
        else if (overlaps >= (isPad ? PAD_LIMIT : settings.maxMelodicVoices)) reason = "voice-limit";

        if (reason) {
          suppressed.push({ id: note.id, celestialEventId: note.celestialEventId, reason });
          continue;
        }

        voices.set(note.id, {
          isPad, start, end,
          handle: scheduleInstrumentVoice(context, isPad ? graph.ambient : graph.melodic, note, start, duration,
            () => voices.delete(note.id)),
        });
        admitted.push({ ...note, effectiveStart: start - origin, effectiveDuration: duration,
          release: instruments[note.instrument].release });
        if (!isPad) {
          retainedMelodic += 1;
          peak = Math.max(peak, overlaps + 1);
        }
      }
    },
    diagnostics() {
      const now = context.currentTime;
      const active = [...voices.values()].filter(({ start, end }) => start <= now && now < end);
      return {
        scheduledVoiceCount: voices.size, retainedMelodic, peakMelodicVoiceCount: peak,
        activeMelodicVoiceCount: active.filter((voice) => !voice.isPad).length,
        ambientVoiceCount: active.filter((voice) => voice.isPad).length,
        atmosphereLayerCount: Number(Boolean(atmosphere) && now >= origin),
        suppressed: suppressed.map((event) => ({ ...event })),
      };
    },
    journal() {
      return { admitted: admitted.map(note => ({ ...note })), suppressed: suppressed.map(note => ({ ...note })) };
    },
    stop() {
      for (const voice of voices.values()) voice.handle.stop();
      atmosphere?.stop();
      voices.clear();
    },
  };
}

function tailDuration(settings) {
  // The longest release is 0.6 s. Both paths end at the same bounded tail.
  return Math.min(4, 0.6 + settings.reverbDuration);
}

export async function renderCompositionOffline(composition, config) {
  const prepared = prepareComposition(composition);
  const settings = validateAudioConfig(config);
  if (typeof globalThis.OfflineAudioContext !== "function") throw new Error("Offline Web Audio is unavailable.");
  const frames = Math.ceil((prepared.duration + (prepared.hardEnd ? 0 : tailDuration(settings))) * settings.sampleRate);
  const context = new OfflineAudioContext(2, frames, settings.sampleRate);
  const graph = createAudioGraph(context, context.destination, settings);
  const schedule = createSchedule(context, graph, prepared, settings, 0);
  schedule.fill(Infinity);
  try {
    return await context.startRendering();
  } finally {
    schedule.stop();
    graph.disconnect();
  }
}

export class AudioEngine {
  #context = null;
  #settings;
  #composition = null;
  #state = "idle";
  #graph = null;
  #schedule = null;
  #timer = null;
  #origin = 0;
  #position = 0;
  #revision = 0;
  #lastDiagnostics = null;
  #lastJournal = null;
  #error = "";
  #starting = false;

  constructor(config) {
    this.#settings = validateAudioConfig(config);
  }

  getState() { return this.#state; }
  getDuration() { return this.#composition?.duration ?? 0; }

  getSchedulingJournal() {
    return this.#schedule?.journal() ?? structuredClone(this.#lastJournal ?? { admitted: [], suppressed: [] });
  }

  appendNotes(notes) {
    if (this.#state !== "playing" || this.#composition.fixedPlayback) throw new Error("Live insertion requires an active recording session.");
    return this.#schedule.append(notes);
  }

  getPlaybackPosition() {
    if (this.#state !== "playing") return this.#position;
    return bounded(this.#context.currentTime - this.#origin, 0, 0, this.getDuration());
  }

  getDiagnostics() {
    const stats = this.#schedule?.diagnostics() ?? this.#lastDiagnostics ?? {
      scheduledVoiceCount: 0, retainedMelodic: 0, peakMelodicVoiceCount: 0,
      activeMelodicVoiceCount: 0, ambientVoiceCount: 0, atmosphereLayerCount: 0, suppressed: [],
    };
    return {
      ...stats, suppressed: stats.suppressed.map((event) => ({ ...event })),
      suppressedEventCount: stats.suppressed.length, contextState: this.#context?.state ?? "uninitialized",
      error: this.#error,
    };
  }

  #requireOpen() {
    if (this.#state === "disposed") throw new Error("This audio engine has been disposed.");
  }

  async initialize() {
    this.#requireOpen();
    const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (typeof Context !== "function") throw new Error("This browser does not support live Web Audio.");
    this.#context ??= new Context();
    if (this.#state !== "paused") await this.#context.resume();
  }

  loadComposition(composition) {
    this.#requireOpen();
    const prepared = prepareComposition(composition);
    this.stop();
    this.#composition = prepared;
    this.#lastDiagnostics = this.#lastJournal = null;
  }

  async play() {
    this.#requireOpen();
    if (this.#starting || this.#state === "playing" || this.#state === "paused") return;
    if (!this.#composition) throw new Error("Generate or load a composition first.");
    const revision = ++this.#revision;
    this.#starting = true;
    this.#error = "";
    try {
      await this.initialize();
      if (revision !== this.#revision) return;
      this.#graph = createAudioGraph(this.#context, this.#context.destination, this.#settings);
      this.#origin = this.#context.currentTime + (this.#composition.fixedPlayback ? 0.15 : LEAD);
      this.#schedule = createSchedule(this.#context, this.#graph, this.#composition, this.#settings, this.#origin);
      if (this.#composition.hardEnd) {
        this.#graph.endpoint.gain.setValueAtTime(0, this.#origin + this.getDuration());
      }
      if (this.#composition.fixedPlayback) this.#schedule.fill(Infinity);
      this.#position = 0;
      this.#lastDiagnostics = this.#lastJournal = null;
      this.#state = "playing";
      this.#startTimer();
    } catch (error) {
      if (revision !== this.#revision) return;
      this.stop();
      throw error;
    } finally {
      if (revision === this.#revision) this.#starting = false;
    }
  }

  #startTimer() {
    this.#clearTimer();
    const tick = () => {
      try {
        const now = this.#context.currentTime;
        const end = this.#origin + this.getDuration();
        this.#schedule.fill(now >= end ? Infinity : now + this.#settings.schedulingHorizon, true);
        if (now >= end + (this.#composition.hardEnd ? 0 : tailDuration(this.#settings))) {
          const duration = this.getDuration();
          this.stop();
          this.#position = duration;
        }
      } catch (error) {
        this.#error = error.message;
        this.stop();
      }
    };
    this.#timer = setInterval(tick, this.#settings.schedulerInterval);
    tick();
  }

  #clearTimer() {
    clearInterval(this.#timer);
    this.#timer = null;
  }

  async pause() {
    if (this.#state !== "playing") return;
    const revision = ++this.#revision;
    this.#position = this.getPlaybackPosition();
    this.#state = "paused";
    this.#clearTimer();
    try {
      await this.#context.suspend();
      if (revision === this.#revision) {
        this.#position = bounded(this.#context.currentTime - this.#origin, 0, 0, this.getDuration());
      }
    } catch (error) {
      if (revision !== this.#revision) return;
      this.stop();
      throw error;
    }
  }

  async resume() {
    if (this.#state !== "paused" || this.#starting) return;
    const revision = ++this.#revision;
    this.#starting = true;
    try {
      await this.#context.resume();
      if (revision !== this.#revision) return;
      this.#state = "playing";
      this.#startTimer();
    } catch (error) {
      if (revision !== this.#revision) return;
      this.stop();
      throw error;
    } finally {
      if (revision === this.#revision) this.#starting = false;
    }
  }

  stop() {
    if (this.#state === "disposed") return;
    this.#revision += 1;
    this.#starting = false;
    this.#clearTimer();
    const stats = this.#schedule?.diagnostics();
    if (this.#schedule) this.#lastJournal = this.#schedule.journal();
    this.#schedule?.stop();
    this.#graph?.disconnect();
    this.#schedule = null;
    this.#graph = null;
    if (stats) this.#lastDiagnostics = {
      ...stats, scheduledVoiceCount: 0, activeMelodicVoiceCount: 0, ambientVoiceCount: 0, atmosphereLayerCount: 0,
    };
    this.#position = 0;
    this.#state = "stopped";
  }

  reset() {
    this.stop();
    this.#composition = null;
    this.#lastDiagnostics = this.#lastJournal = null;
    this.#error = "";
  }

  async dispose() {
    if (this.#state === "disposed") return;
    this.reset();
    const context = this.#context;
    this.#context = null;
    this.#state = "disposed";
    if (context && context.state !== "closed") await context.close();
  }

  #setVolume(key, value, controls) {
    this.#requireOpen();
    const amount = bounded(value, DEFAULT_AUDIO_CONFIG[key], 0, 1);
    this.#settings[key] = amount;
    if (!this.#graph) return;
    const now = this.#context.currentTime;
    for (const [node, target] of controls(amount)) {
      const param = this.#graph[node].gain;
      param.cancelScheduledValues(now);
      param.setTargetAtTime(target, now, 0.012);
      param.setValueAtTime(target, now + 0.085);
    }
  }

  setMasterVolume(value) { this.#setVolume("masterVolume", value, (v) => [["master", v]]); }
  setReverbMix(value) { this.#setVolume("reverbMix", value, (v) => [["dry", 1 - v], ["wet", 0.65 * v]]); }
  setAmbientVolume(value) { this.#setVolume("ambientVolume", value, (v) => [["ambient", v]]); }
  setAtmosphereVolume(value) { this.#setVolume("atmosphereVolume", value, (v) => [["atmosphere", v]]); }
}
