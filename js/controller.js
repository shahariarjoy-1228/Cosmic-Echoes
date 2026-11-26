import { AudioEngine, validateAudioConfig } from "./audio.js";
import { generateAmbientHarmony, mapCelestialEventsToMusic, validateMusicConfig } from "./music.js";
import { GLOBAL_EVENT_BUDGET, canFitTree, countEvents, generateEchoTree, validateConfig } from "./recursion.js";
import { VisualEngine, VISUAL_THEMES, validateVisualConfig } from "./visuals.js";

export const DEFAULT_CONTROLLER_CONFIG = Object.freeze({
  environment: "deep-space", duration: 60, placementLead: 0.16, recordingCapacity: GLOBAL_EVENT_BUDGET,
});

function bounded(value, fallback, min, max) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function environmentTheme(id) {
  if (!Object.hasOwn(VISUAL_THEMES, id)) throw new RangeError("Unknown musical environment.");
  return VISUAL_THEMES[id];
}

export function validateControllerConfig(config = {}) {
  const input = config ?? {};
  const environment = input.environment ?? DEFAULT_CONTROLLER_CONFIG.environment;
  const theme = environmentTheme(environment);
  const audio = validateAudioConfig(input.audio);
  return {
    environment, audio,
    duration: bounded(input.duration, 60, 0.05, 60),
    placementLead: bounded(input.placementLead, Math.max(0.16, audio.schedulingHorizon + 0.04), audio.schedulingHorizon + 0.04, 0.5),
    recordingCapacity: Math.round(bounded(input.recordingCapacity, GLOBAL_EVENT_BUDGET, 1, GLOBAL_EVENT_BUDGET)),
    recursion: validateConfig(input.recursion),
    music: validateMusicConfig({ ...input.music, scaleId: theme.scaleId }),
    visuals: validateVisualConfig({ ...input.visuals, theme: environment }),
  };
}

function rejection(reason, message) {
  return { accepted: false, reason, message };
}

export class CosmicEchoesController {
  #audio;
  #visual;
  #settings;
  #state = "idle";
  #record = null;
  #recordedCount = 0;
  #session = 0;
  #root = 0;
  #rejected = 0;
  #revision = 0;
  #transition = false;
  #replay = false;
  #monitor = 1;
  #lastPosition = 0;
  #error = "";

  constructor(canvas, config) {
    this.#settings = validateControllerConfig(config);
    this.#visual = new VisualEngine(canvas, this.#settings.visuals);
    this.#audio = new AudioEngine(this.#settings.audio);
  }

  #requireOpen() {
    if (this.#state === "disposed") throw new Error("Controller is disposed.");
  }

  async initialize() {
    this.#requireOpen();
    await this.#audio.initialize();
  }

  async startSession() {
    this.#requireOpen();
    if (["initializing", "playing", "paused", "replaying"].includes(this.#state)) return false;
    const { environment, duration, music, audio } = this.#settings;
    const ambient = generateAmbientHarmony(music, 0, duration);
    const recording = {
      schemaVersion: 1, sessionId: `session-${++this.#session}`, environment,
      duration, endpoint: null, termination: null, placements: [], admitted: [], suppressed: [], cancelled: [],
      interrupted: [], ambient, audioConfig: { ...audio },
      releasePolicy: { starlight: 0.22, echo: 0.16, pad: 0.6, maximumTail: 4, earlyStop: "hard-cut" },
    };
    const previous = this.#record;
    const previousCount = this.#recordedCount;
    this.#record = recording;
    this.#recordedCount = this.#root = this.#rejected = 0;
    try {
      return await this.#begin({ ambient, duration }, environment, false);
    } catch (error) {
      if (this.#record === recording) {
        this.#record = previous;
        this.#recordedCount = previousCount;
      }
      throw error;
    }
  }

  async #begin(composition, environment, replay) {
    const revision = ++this.#revision;
    this.#state = "initializing";
    this.#replay = replay;
    this.#lastPosition = 0;
    this.#error = "";
    try {
      this.#visual.reset();
      this.#visual.setTheme(environment);
      if (replay) this.#visual.addEvents(this.#record.placements.flatMap(({ events }) => events));
      this.#audio.loadComposition(composition);
      this.#audio.setMasterVolume(this.#settings.audio.masterVolume * this.#monitor);
      await this.#audio.play();
      if (revision !== this.#revision) return false;
      if (this.#audio.getState() !== "playing") throw new Error(this.#audio.getDiagnostics().error || "Audio did not start.");
      this.#state = replay ? "replaying" : "playing";
      this.#visual.start(this.#frameTime);
      return true;
    } catch (error) {
      if (revision !== this.#revision) return false;
      this.#error = error.message;
      this.#audio.stop();
      this.#visual.reset();
      this.#state = "stopped";
      throw error;
    }
  }

  #frameTime = () => {
    const position = this.#audio.getPlaybackPosition();
    if (this.#audio.getState() === "stopped") {
      const error = this.#audio.getDiagnostics().error;
      if (error) {
        this.#error = error;
        this.#finish("error", this.#lastPosition);
        return this.#lastPosition;
      }
      this.#finish("completed", position);
    } else this.#lastPosition = position;
    return position;
  };

  placeStar(x, y) {
    const reject = (reason, message) => {
      this.#rejected += 1;
      return rejection(reason, message);
    };
    if (this.#state !== "playing" || this.#transition) return reject("invalid-state", "Start or resume a recording session to place stars.");
    if (this.#audio.getState() !== "playing") return reject("audio-unavailable", "The audio transport is unavailable.");
    if (![x, y].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) {
      return reject("invalid-coordinates", "Enter normalized coordinates from 0 to 1.");
    }
    const { recursion, music, placementLead, recordingCapacity } = this.#settings;
    const count = countEvents(recursion.maxDepth, recursion.childrenPerStar);
    const position = this.#audio.getPlaybackPosition();
    const onset = position + placementLead;
    if (onset >= this.#record.duration) return reject("session-duration", "The session is ending.");
    const occupied = this.#record.placements.reduce((total, root) =>
      total + root.events.filter(event => position < event.startTime + event.duration).length, 0);
    if (!canFitTree(recursion, occupied)) return reject("event-capacity", "The complete tree does not fit the remaining event capacity.");
    if (this.#recordedCount + count > recordingCapacity) return reject("recording-capacity", "The recording is full.");

    const id = `${this.#record.sessionId}-root-${this.#root + 1}`;
    let undo;
    try {
      const events = generateEchoTree({ id, x, y }, recursion, onset);
      const notes = mapCelestialEventsToMusic(events, music);
      if ([...events, ...notes].some(event => event.startTime + event.duration > this.#record.duration)) {
        return reject("session-duration", "The complete tree does not fit before the session endpoint.");
      }
      this.#visual.renderAt(position);
      // Nothing sounds synchronously. The audio queue rollback is valid until the next poll.
      undo = this.#audio.appendNotes(notes);
      this.#visual.addEvents(events, { redraw: false });
      this.#record.placements.push({ id, x, y, onset, recursion: { ...recursion }, music: { ...music }, events, notes });
      this.#recordedCount += count;
      this.#root += 1;
      return { accepted: true, rootId: id, onset, eventCount: count };
    } catch (error) {
      undo?.();
      this.#error = error.message;
      return reject("integration-failure", error.message);
    }
  }

  async pause() {
    if (!["playing", "replaying"].includes(this.#state) || this.#transition) return false;
    const revision = this.#revision;
    this.#transition = true;
    this.#visual.pause();
    try {
      await this.#audio.pause();
      if (revision !== this.#revision) return false;
      this.#lastPosition = this.#audio.getPlaybackPosition();
      this.#visual.renderAt(this.#lastPosition);
      this.#state = "paused";
      return true;
    } catch (error) {
      if (revision === this.#revision) { this.#error = error.message; this.#finish("error", this.#lastPosition); }
      return false;
    } finally { if (revision === this.#revision) this.#transition = false; }
  }

  async resume() {
    if (this.#state !== "paused" || this.#transition) return false;
    const revision = this.#revision;
    this.#transition = true;
    try {
      await this.#audio.resume();
      if (revision !== this.#revision) return false;
      if (this.#audio.getState() !== "playing") throw new Error("Audio did not resume.");
      this.#state = this.#replay ? "replaying" : "playing";
      this.#visual.resume();
      return true;
    } catch (error) {
      if (revision === this.#revision) { this.#error = error.message; this.#finish("error", this.#lastPosition); }
      return false;
    } finally { if (revision === this.#revision) this.#transition = false; }
  }

  #finish(termination, endpoint) {
    this.#revision += 1;
    this.#transition = false;
    if (this.#record && !this.#replay && this.#record.endpoint === null) {
      const { admitted, suppressed } = this.#audio.getSchedulingJournal();
      const record = this.#record;
      record.endpoint = endpoint;
      record.termination = termination;
      record.admitted = admitted.filter(note => note.effectiveStart < endpoint);
      record.suppressed = suppressed;
      const accounted = new Set([...record.admitted, ...suppressed].map(({ id }) => id));
      const candidates = [...record.placements.flatMap(({ notes }) => notes), ...record.ambient];
      record.cancelled = candidates.filter(note => !accounted.has(note.id))
        .map(({ id, celestialEventId }) => ({ id, celestialEventId, reason: "stopped-before-onset" }));
      if (termination !== "completed") {
        record.interrupted = record.admitted.filter(note =>
          note.effectiveStart + note.effectiveDuration + note.release > endpoint)
          .map(note => ({ id: note.id, elapsed: endpoint - note.effectiveStart, release: note.release }));
      }
    }
    this.#audio.stop();
    this.#visual.stop();
    this.#visual.clear();
    this.#lastPosition = endpoint;
    this.#state = termination === "completed" ? "completed" : "stopped";
  }

  stop() {
    if (this.#state === "disposed") return;
    if (["initializing", "playing", "paused", "replaying"].includes(this.#state)) {
      this.#finish("stopped", this.#audio.getPlaybackPosition());
    }
  }

  reset() {
    this.#requireOpen();
    this.stop();
    this.#audio.reset();
    this.#visual.reset();
    this.#record = null;
    this.#recordedCount = this.#rejected = this.#lastPosition = 0;
    this.#state = "idle";
    this.#error = "";
  }

  async replay() {
    this.#requireOpen();
    if (!["stopped", "completed"].includes(this.#state)) return false;
    const input = this.getOfflineCompositionInput();
    if (!input) return false;
    return this.#begin({ ...input.composition, fixedPlayback: true }, this.#record.environment, true);
  }

  async dispose() {
    if (this.#state === "disposed") return;
    this.stop();
    this.#state = "disposed";
    this.#visual.dispose();
    this.#record = null;
    this.#recordedCount = 0;
    await this.#audio.dispose();
  }

  setRecursionConfig(config) {
    this.#requireOpen();
    this.#settings.recursion = validateConfig(config);
    return { ...this.#settings.recursion };
  }

  setEnvironment(id) {
    this.#requireOpen();
    if (["initializing", "playing", "paused", "replaying"].includes(this.#state)) throw new Error("Stop playback before changing environment.");
    const theme = environmentTheme(id);
    const music = validateMusicConfig({ ...this.#settings.music, scaleId: theme.scaleId });
    this.#visual.setTheme(id);
    this.#settings.music = music;
    this.#settings.environment = id;
  }

  setMonitoringVolume(value) {
    this.#requireOpen();
    this.#monitor = bounded(value, 1, 0, 1);
    this.#audio.setMasterVolume(this.#settings.audio.masterVolume * this.#monitor);
  }

  setReducedMotion(mode) { this.#visual.setReducedMotion(mode); }
  setParticlesEnabled(enabled) { this.#visual.setParticlesEnabled(enabled); }
  setRipplesEnabled(enabled) { this.#visual.setRipplesEnabled(enabled); }
  setConnectionsEnabled(enabled) { this.#visual.setConnectionsEnabled(enabled); }

  getState() { return this.#state; }

  getPlaybackPosition() {
    return ["playing", "replaying", "paused"].includes(this.#state)
      ? this.#audio.getPlaybackPosition() : this.#lastPosition;
  }

  getDiagnostics() {
    const visual = this.#visual.getDiagnostics();
    const audio = this.#audio.getDiagnostics();
    const position = this.getPlaybackPosition();
    const duration = this.#replay ? this.#record?.endpoint ?? 0 : this.#record?.duration ?? this.#settings.duration;
    return {
      state: this.#state, audioState: this.#audio.getState(), mode: this.#replay ? "replay" : "record",
      position, duration, remainingDuration: Math.max(0, duration - position),
      visualTime: visual.position,
      logicalTimelineDifference: Math.abs(position - visual.position),
      pending: visual.pending, active: visual.active, occupied: visual.occupied, remaining: visual.remaining,
      acceptedRoots: this.#record?.placements.length ?? 0, rejectedPlacements: this.#rejected,
      recordedEvents: this.#recordedCount, rawNotes: this.#recordedCount,
      environment: this.#replay ? this.#record?.environment : this.#settings.environment,
      error: this.#error || audio.error || visual.error, audio, visual,
    };
  }

  getCompositionSnapshot() {
    return this.#record ? structuredClone(this.#record) : null;
  }

  getOfflineCompositionInput() {
    const record = this.#record;
    if (!record || record.endpoint === null || record.endpoint < 0.000001) return null;
    const materialize = ({ effectiveStart, effectiveDuration, release, ...note }) =>
      ({ ...note, startTime: effectiveStart });
    const admitted = record.admitted.map(materialize);
    return {
      composition: {
        notes: admitted.filter(note => note.role !== "ambient"),
        ambient: admitted.filter(note => note.role === "ambient"),
        duration: record.endpoint, layerDuration: record.duration, hardEnd: record.termination !== "completed",
      },
      config: { ...record.audioConfig },
    };
  }
}
