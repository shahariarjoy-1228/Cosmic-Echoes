import { GLOBAL_EVENT_BUDGET, MAX_EVENTS_PER_ROOT } from "./recursion.js";

function scale(tonic, intervals, environment) {
  return Object.freeze({ tonic, intervals: Object.freeze(intervals), environment });
}

export const MUSICAL_SCALES = Object.freeze({
  "c-major-pentatonic": scale(0, [0, 2, 4, 7, 9], "Deep Space"),
  "a-minor-pentatonic": scale(9, [0, 3, 5, 7, 10], "Nebula Dreams"),
  "f-major-pentatonic": scale(5, [0, 2, 4, 7, 9], "Solar Harmony"),
});

export const DEFAULT_MUSIC_CONFIG = Object.freeze({
  scaleId: "c-major-pentatonic",
  minMidi: 48,
  maxMidi: 79,
  maxIntensity: 0.7,
  panLimit: 0.65,
});

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAX_MELODIC_VOICES = 8;
const AMBIENT_DURATION = 60;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function between(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function optionalNumber(value, fallback, min, max, integer = false) {
  if (!Number.isFinite(value)) return fallback;
  return clamp(integer ? Math.round(value) : value, min, max);
}

function requireMidi(note) {
  if (!Number.isInteger(note) || !between(note, 0, 127)) {
    throw new RangeError("MIDI notes must be integers from 0 to 127.");
  }
}

export function isValidScaleId(scaleId) {
  return typeof scaleId === "string" && Object.hasOwn(MUSICAL_SCALES, scaleId);
}

export function getScale(scaleId = DEFAULT_MUSIC_CONFIG.scaleId) {
  if (!isValidScaleId(scaleId)) throw new RangeError("Unsupported scale identifier.");
  return MUSICAL_SCALES[scaleId];
}

function inScale(note, definition) {
  return definition.intervals.includes((note - definition.tonic + 12) % 12);
}

export function isNoteInScale(note, scaleId) {
  requireMidi(note);
  return inScale(note, getScale(scaleId));
}

export function buildScaleNotes(scaleId, minMidi = 48, maxMidi = 79) {
  const definition = getScale(scaleId);
  requireMidi(minMidi);
  requireMidi(maxMidi);
  const notes = [];
  for (let note = minMidi; note <= maxMidi; note += 1) {
    if (inScale(note, definition)) notes.push(note);
  }
  if (notes.length === 0) throw new RangeError("The MIDI range must contain a note in the selected scale.");
  return notes;
}

export function midiToFrequency(note) {
  requireMidi(note);
  return 440 * 2 ** ((note - 69) / 12);
}

export function midiToNoteName(note) {
  requireMidi(note);
  return NOTE_NAMES[note % 12] + (Math.floor(note / 12) - 1);
}

export function validateMusicConfig(config) {
  const input = config ?? {};
  const defaults = DEFAULT_MUSIC_CONFIG;
  const settings = {
    scaleId: input.scaleId === undefined ? defaults.scaleId : input.scaleId,
    minMidi: optionalNumber(input.minMidi, defaults.minMidi, 0, 127, true),
    maxMidi: optionalNumber(input.maxMidi, defaults.maxMidi, 0, 127, true),
    maxIntensity: optionalNumber(input.maxIntensity, defaults.maxIntensity, 0, 0.7),
    panLimit: optionalNumber(input.panLimit, defaults.panLimit, 0, 0.65),
  };
  buildScaleNotes(settings.scaleId, settings.minMidi, settings.maxMidi);
  return settings;
}

function requireBatch(events) {
  if (!Array.isArray(events)) throw new TypeError("Expected an event array.");
  if (events.length > GLOBAL_EVENT_BUDGET) throw new RangeError("An event batch may contain at most 300 events.");
}

function isId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function byDepthAndId(a, b) {
  return a.depth - b.depth || (a.id < b.id ? -1 : Number(a.id > b.id));
}

function chronological(a, b) {
  return a.startTime - b.startTime || byDepthAndId(a, b);
}

function validateCelestialEvent(event) {
  if (!isId(event?.id) || !isId(event.rootId)) throw new TypeError("Celestial event and root IDs are required.");
  if (!between(event.x, 0, 1) || !between(event.y, 0, 1) ||
      !between(event.amplitude, 0, 1) || !Number.isInteger(event.depth) || !between(event.depth, 0, 4) ||
      !Number.isFinite(event.startTime) || event.startTime < 0 ||
      !Number.isFinite(event.duration) || event.duration <= 0 ||
      !Number.isFinite(event.radius) || event.radius <= 0 || !Number.isFinite(event.angle)) {
    throw new RangeError("Invalid celestial geometry, depth, amplitude, or timing.");
  }
  if (event.depth === 0) {
    if (event.parentId !== null || event.childIndex !== null) throw new TypeError("Roots require null parent and child index.");
  } else if (!isId(event.parentId) || !Number.isInteger(event.childIndex) || !between(event.childIndex, 0, 2)) {
    throw new TypeError("Children require a parent ID and a child index from 0 to 2.");
  }
}

function pitchFields(midiNote) {
  return { midiNote, noteName: midiToNoteName(midiNote), frequency: midiToFrequency(midiNote) };
}

export function mapCelestialEventsToMusic(events, config) {
  requireBatch(events);
  const settings = validateMusicConfig(config);
  const pitches = buildScaleNotes(settings.scaleId, settings.minMidi, settings.maxMidi);
  const seen = new Map();
  const rootCounts = new Map();
  for (const event of events) validateCelestialEvent(event);
  const ordered = [...events].sort(byDepthAndId);
  const mapped = ordered.map((event) => {
    if (seen.has(event.id)) throw new TypeError("Duplicate celestial event ID.");
    const parent = seen.get(event.parentId);
    if (event.depth === 0) {
      if (rootCounts.has(event.rootId)) throw new TypeError("Duplicate root association.");
    } else if (!parent || parent.rootId !== event.rootId || parent.depth + 1 !== event.depth ||
               parent.startTime > event.startTime) {
      throw new TypeError("Invalid parent relationship, root association, or child onset.");
    }

    const count = (rootCounts.get(event.rootId) ?? 0) + 1;
    if (count > MAX_EVENTS_PER_ROOT) throw new RangeError("A musical tree may contain at most 121 celestial events.");
    rootCounts.set(event.rootId, count);

    let pitchIndex;
    if (parent) {
      const parentIndex = pitches.indexOf(parent.midiNote);
      const direction = event.depth % 2 === 1 ? 1 : -1;
      const steps = [2, -2, 0][event.childIndex] * direction;
      pitchIndex = clamp(parentIndex + steps, 0, pitches.length - 1);
      // Move back toward the parent if a wider scale step would exceed a fifth.
      while (Math.abs(pitches[pitchIndex] - parent.midiNote) > 7) pitchIndex -= Math.sign(steps);
    } else {
      const position = (event.x + 1 - event.y) / 2;
      pitchIndex = Math.round((0.25 + position * 0.5) * (pitches.length - 1));
    }
    const note = {
      id: JSON.stringify(["note", event.id]),
      celestialEventId: event.id,
      rootId: event.rootId,
      parentMusicalEventId: parent?.id ?? null,
      depth: event.depth,
      ...pitchFields(pitches[pitchIndex]),
      startTime: event.startTime,
      duration: clamp(event.duration * (1 + Math.min(event.radius, 1)) / (1 + event.depth * 0.15), 0.4, 3),
      intensity: event.amplitude * settings.maxIntensity,
      pan: (2 * event.x - 1) * settings.panLimit,
      instrument: parent ? "echo" : "starlight",
      role: parent ? "echo" : "melody",
    };
    seen.set(event.id, note);
    return note;
  });
  return mapped.sort(chronological);
}

export function generateAmbientHarmony(config, startTime = 0, duration = AMBIENT_DURATION) {
  const { scaleId } = validateMusicConfig(config);
  const { tonic } = getScale(scaleId);
  const onset = Number.isFinite(startTime) ? Math.max(0, startTime) : 0;
  const length = optionalNumber(duration, AMBIENT_DURATION, 0.4, AMBIENT_DURATION);
  if (onset + length <= onset) throw new RangeError("Ambient onset is too large to represent the duration.");
  const tonicMidi = 36 + tonic;
  return [tonicMidi, tonicMidi + 7].map((midiNote) => ({
    id: JSON.stringify(["ambient", scaleId, onset, length, midiNote]),
    celestialEventId: null,
    rootId: null,
    parentMusicalEventId: null,
    depth: null,
    ...pitchFields(midiNote),
    startTime: onset,
    duration: length,
    intensity: 0.12,
    pan: 0,
    instrument: "nebula-pad",
    role: "ambient",
  }));
}

export function planMelodicVoices(notes, voiceLimit = MAX_MELODIC_VOICES) {
  requireBatch(notes);
  const limit = optionalNumber(voiceLimit, MAX_MELODIC_VOICES, 1, MAX_MELODIC_VOICES, true);
  const ids = new Set();
  for (const note of notes) {
    if (!isId(note?.id) || ids.has(note.id) || !["melody", "echo"].includes(note.role) ||
        !Number.isInteger(note.depth) || !between(note.depth, 0, 4) ||
        !Number.isFinite(note.startTime) || note.startTime < 0 ||
        !between(note.duration, 0.4, 3) || note.startTime + note.duration <= note.startTime ||
        !between(note.intensity, 0, 0.7)) {
      throw new TypeError("Expected unique, valid melodic or echo notes with representable intervals.");
    }
    ids.add(note.id);
  }
  const retained = [];
  const suppressed = [];
  let activeEnds = [];
  for (const note of [...notes].sort(chronological)) {
    activeEnds = activeEnds.filter((end) => end > note.startTime);
    if (note.intensity === 0 || activeEnds.length >= limit) {
      suppressed.push(note);
    } else {
      retained.push(note);
      activeEnds.push(note.startTime + note.duration);
    }
  }
  return { retained, suppressed };
}
