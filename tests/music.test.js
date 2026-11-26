import { generateEchoTree } from "../js/recursion.js";
import {
  DEFAULT_MUSIC_CONFIG, MUSICAL_SCALES, buildScaleNotes, generateAmbientHarmony, getScale,
  isNoteInScale, isValidScaleId, mapCelestialEventsToMusic, midiToFrequency, midiToNoteName,
  planMelodicVoices, validateMusicConfig,
} from "../js/music.js";

const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
const root = { id: "star", x: 0.5, y: 0.5 };
let passed = 0;
let failed = 0;

function assert(condition, message = "Unexpected result") {
  if (!condition) throw new Error(message);
}

function equal(actual, expected) {
  assert(Object.is(actual, expected), `Expected ${expected}, received ${actual}`);
}

function same(actual, expected) {
  equal(JSON.stringify(actual), JSON.stringify(expected));
}

function near(actual, expected) {
  assert(Math.abs(actual - expected) < 1e-6, `Expected approximately ${expected}, received ${actual}`);
}

function throws(run, expectedError) {
  let caught;
  try { run(); } catch (error) { caught = error; }
  assert(caught instanceof expectedError, `Expected ${expectedError.name}`);
}

function test(name, run) {
  const item = document.createElement("li");
  try {
    run();
    passed += 1;
    item.textContent = `PASS: ${name}`;
  } catch (error) {
    failed += 1;
    item.textContent = `FAIL: ${name} (${error.message})`;
  }
  results.append(item);
}

function makeRoot(overrides = {}) {
  return generateEchoTree({ ...root, ...overrides }, { maxDepth: 0 });
}

function changeRoot(fields) {
  return [{ ...makeRoot()[0], ...fields }];
}

const tree = generateEchoTree(root, { maxDepth: 4, childrenPerStar: 3 }, 2);
const mapped = mapCelestialEventsToMusic(tree);
const byCelestial = new Map(mapped.map(note => [note.celestialEventId, note]));
const ambient = generateAmbientHarmony(undefined, 2, 12);
const dense = mapCelestialEventsToMusic(
  Array.from({ length: 12 }, (_, index) => makeRoot({ id: `root-${index}` })[0]),
);

test("Default scale", () => {
  equal(validateMusicConfig().scaleId, "c-major-pentatonic");
});

test("Registry is available and immutable", () => {
  equal(Object.keys(MUSICAL_SCALES).length, 3);
  for (const id of Object.keys(MUSICAL_SCALES)) { assert(isValidScaleId(id));
  assert(Object.isFrozen(getScale(id).intervals));
  assert(Object.isFrozen(getScale(id))); } assert(Object.isFrozen(MUSICAL_SCALES));
});

test("c-major-pentatonic pitch classes", () => {
  same(buildScaleNotes("c-major-pentatonic", 60, 71).map(note => note % 12), [0,2,4,7,9]);
});

test("a-minor-pentatonic pitch classes", () => {
  same(buildScaleNotes("a-minor-pentatonic", 60, 71).map(note => note % 12), [0,2,4,7,9]);
});

test("f-major-pentatonic pitch classes", () => {
  same(buildScaleNotes("f-major-pentatonic", 60, 71).map(note => note % 12), [0,2,5,7,9]);
});

test("A4 frequency", () => {
  equal(midiToFrequency(69), 440);
});

test("C4 frequency", () => {
  near(midiToFrequency(60), 261.625565);
});

test("C4 name", () => {
  equal(midiToNoteName(60), "C4");
});

test("A4 name", () => {
  equal(midiToNoteName(69), "A4");
});

test("Unsupported identifiers", () => {
  for (const id of ["wrong", "constructor", "__proto__", null]) { assert(!isValidScaleId(id));
  throws(() => getScale(id), RangeError);
  throws(() => validateMusicConfig({ scaleId: id }), RangeError); };
});

test("Notes in an ordered inclusive range", () => {
  same(buildScaleNotes(undefined, 60, 67), [60, 62, 64, 67]);
});

test("Impossible and reversed ranges", () => {
  for (const [minMidi, maxMidi] of [[61, 61], [72, 60]]) throws(() => validateMusicConfig({ minMidi, maxMidi }), RangeError);
});

test("One root maps to one note", () => {
  equal(mapCelestialEventsToMusic(makeRoot()).length, 1);
});

test("Default tree maps to 15 notes", () => {
  equal(mapCelestialEventsToMusic(generateEchoTree(root)).length, 15);
});

test("Maximum tree maps to 121 notes", () => {
  equal(mapped.length, 121);
});

test("Celestial references", () => {
  equal(new Set(mapped.map(note => note.celestialEventId)).size, tree.length);
  for (const event of tree) assert(byCelestial.has(event.id));
});

test("Musical parent references", () => {
  for (const event of tree.slice(1)) equal(byCelestial.get(event.id).parentMusicalEventId, byCelestial.get(event.parentId).id);
  equal(mapped[0].parentMusicalEventId, null);
});

test("Root links", () => {
  for (const note of mapped) equal(note.rootId, root.id);
});

test("Deep deterministic equality", () => {
  same(mapCelestialEventsToMusic(tree), mapped);
});

test("Position changes root pitch", () => {
  assert(mapCelestialEventsToMusic(makeRoot({ x: 0, y: 1 }))[0].midiNote < mapCelestialEventsToMusic(makeRoot({ x: 1, y: 0 }))[0].midiNote);
});

test("Child index and depth define directional answers", () => {
  const [parent, ...children] = mapCelestialEventsToMusic(generateEchoTree(root, { maxDepth: 2, childrenPerStar: 3 }));
  same(children.slice(0, 3).map(note => note.midiNote - parent.midiNote), [5, -4, 0]);
  const branch = children[0];
  const next = children.filter(note => note.parentMusicalEventId === branch.id);
  assert(next[0].midiNote < branch.midiNote);
  assert(next[1].midiNote > branch.midiNote);
  equal(next[2].midiNote, branch.midiNote);
});

test("Scale membership across all trees", () => {
  for (const scaleId of Object.keys(MUSICAL_SCALES)) assert(mapCelestialEventsToMusic(tree, { scaleId }).every(note => isNoteInScale(note.midiNote, scaleId)));
});

test("Pitch range and boundary fallback", () => {
  const notes = mapCelestialEventsToMusic(tree, { minMidi: 60, maxMidi: 62 });
  assert(notes.every(({ midiNote }) => midiNote === 60 || midiNote === 62));
  assert(mapCelestialEventsToMusic(tree, { minMidi: 60, maxMidi: 60 }).every(note => note.midiNote === 60));
});

test("Frequencies are positive and finite", () => {
  assert(mapped.every(note => Number.isFinite(note.frequency) && note.frequency > 0));
});

test("Frozen arrays and events", () => {
  const frozen = Object.freeze(tree.map(event => Object.freeze({ ...event })));
  same(mapCelestialEventsToMusic(frozen), mapped);
});

test("Frozen configuration", () => {
  const config = Object.freeze({ panLimit: 0.2 });
  mapCelestialEventsToMusic(tree, config);
  equal(config.panLimit, 0.2);
});

test("Root trees remain independent", () => {
  const a = generateEchoTree(root);
  const b = generateEchoTree({ ...root, id: "other" });
  const notes = mapCelestialEventsToMusic([...a, ...b]);
  same(notes.filter(note => note.rootId === root.id), mapCelestialEventsToMusic(a));
  same(notes.filter(note => note.rootId === "other"), mapCelestialEventsToMusic(b));
});

test("Onsets exactly match celestial times", () => {
  for (const event of tree) equal(byCelestial.get(event.id).startTime, event.startTime);
});

test("Tempo scaling happens once", () => {
  const notes = mapCelestialEventsToMusic(generateEchoTree(root, { maxDepth: 1, tempo: 80 }, 3));
  near(notes[1].startTime - notes[0].startTime, 0.55);
});

test("Children begin at or after parents", () => {
  for (const event of tree.slice(1)) assert(byCelestial.get(event.id).startTime >= byCelestial.get(event.parentId).startTime);
});

test("Chronological output", () => {
  assert(mapped.every((note, index) => index === 0 || mapped[index - 1].startTime <= note.startTime));
});

test("Simultaneous notes have stable ties", () => {
  same(mapCelestialEventsToMusic([...tree].reverse()), mapped);
  const notes = mapCelestialEventsToMusic([...makeRoot({ id: "z" }), ...makeRoot({ id: "a" })]);
  same(notes.map(note => note.rootId), ["a", "z"]);
});

test("Durations are bounded and use geometry", () => {
  assert(mapped.every(note => note.duration >= 0.4 && note.duration <= 3));
  near(mapped[0].duration, 1.344);
  equal(mapCelestialEventsToMusic(changeRoot({ duration: 100 }))[0].duration, 3);
  equal(mapCelestialEventsToMusic(changeRoot({ duration: 0.01 }))[0].duration, 0.4);
});

test("Intensity is bounded and finite", () => {
  assert(mapped.every(note => Number.isFinite(note.intensity) && note.intensity >= 0 && note.intensity <= 0.7));
  equal(mapped[0].intensity, 0.7);
});

test("Descendants soften", () => {
  for (const event of tree.slice(1)) assert(byCelestial.get(event.id).intensity < byCelestial.get(event.parentId).intensity);
});

test("Silent notes remain silent", () => {
  assert(mapCelestialEventsToMusic(generateEchoTree({ ...root, amplitude: 0 })).every(note => note.intensity === 0));
});

test("Left, center and right pan", () => {
  same([0, 0.5, 1].map(x => mapCelestialEventsToMusic(makeRoot({ x }))[0].pan), [-0.65, 0, 0.65]);
});

test("Pan remains in configured limits", () => {
  assert(mapCelestialEventsToMusic(tree, { panLimit: 0.25 }).every(note => Number.isFinite(note.pan) && Math.abs(note.pan) <= 0.25));
});

test("Root and child instruments", () => {
  equal(mapped[0].instrument, "starlight");
  equal(mapped[0].role, "melody");
  assert(mapped.slice(1).every(note => note.instrument === "echo" && note.role === "echo"));
});

test("Ambient tonic", () => {
  for (const scaleId of Object.keys(MUSICAL_SCALES)) equal(generateAmbientHarmony({ scaleId })[0].midiNote % 12, getScale(scaleId).tonic);
});

test("Ambient fifth", () => {
  equal(ambient[1].midiNote - ambient[0].midiNote, 7);
});

test("Ambient scale compatibility", () => {
  for (const scaleId of Object.keys(MUSICAL_SCALES)) assert(generateAmbientHarmony({ scaleId }).every(note => isNoteInScale(note.midiNote, scaleId)));
});

test("Ambient finite values and requested onset", () => {
  assert(ambient.every(note => Number.isFinite(note.frequency) && note.frequency > 0 && note.startTime === 2 && note.duration === 12 && note.instrument === "nebula-pad" && note.intensity < mapped[0].intensity));
  equal(generateAmbientHarmony(undefined, Infinity, NaN)[0].startTime, 0);
});

test("Ambient duration bounds", () => {
  equal(generateAmbientHarmony(undefined, -1, -1)[0].duration, 0.4);
  equal(generateAmbientHarmony(undefined, 0, 100)[0].duration, 60);
  throws(() => generateAmbientHarmony(undefined, Number.MAX_VALUE), RangeError);
});

test("Ambient determinism", () => {
  same(generateAmbientHarmony(undefined, 2, 12), ambient);
});

test("Ambient pair is separate from celestial notes", () => {
  equal(ambient.length, 2);
  assert(ambient.every(note => note.celestialEventId === null && note.rootId === null && note.parentMusicalEventId === null && note.depth === null && note.role === "ambient"));
  assert(mapped.every(note => note.role !== "ambient"));
  throws(() => planMelodicVoices(ambient), TypeError);
});

test("Fewer than eight overlapping notes retained", () => {
  equal(planMelodicVoices(dense.slice(0, 7)).retained.length, 7);
});

test("Dense simultaneous notes obey eight-voice default", () => {
  equal(planMelodicVoices(dense).retained.length, 8);
});

test("Intervals touching at their ends do not overlap", () => {
  const end = dense[0].startTime + dense[0].duration;
  const next = { ...dense[1], startTime: end };
  equal(planMelodicVoices([dense[0], next], 1).retained.length, 2);
});

test("Shallower notes win simultaneous capacity", () => {
  const rootNote = dense[0];
  const echo = { ...mapped[1], startTime: rootNote.startTime };
  same(planMelodicVoices([echo, rootNote], 1).retained.map(note => note.id), [rootNote.id]);
});

test("Suppression is explicit, including silent notes", () => {
  const silent = { ...dense[0], intensity: 0 };
  const plan = planMelodicVoices([silent, ...dense.slice(1)], 2);
  equal(plan.suppressed.length, dense.length - 2);
  assert(plan.suppressed.includes(silent));
  assert(!plan.retained.includes(silent));
});

test("Voice planning preserves onsets", () => {
  const plan = planMelodicVoices(mapped);
  for (const note of plan.retained) equal(note.startTime, byCelestial.get(note.celestialEventId).startTime);
});

test("Voice plan is deterministic and obeys overlaps", () => {
  const plan = planMelodicVoices(mapped);
  same(planMelodicVoices([...mapped].reverse()), plan);
  for (const { startTime } of plan.retained) assert(plan.retained.filter(note => note.startTime <= startTime && note.startTime + note.duration > startTime).length <= 8);
});

test("Frozen musical notes support planning", () => {
  const frozen = Object.freeze(dense.map(note => Object.freeze({ ...note })));
  same(planMelodicVoices(frozen), planMelodicVoices(dense));
});

test("Empty inputs", () => {
  same(mapCelestialEventsToMusic([]), []);
  same(planMelodicVoices([]), { retained: [], suppressed: [] });
});

test("Optional settings default", () => {
  same(validateMusicConfig(), DEFAULT_MUSIC_CONFIG);
});

test("Non-finite settings default and required data rejects", () => {
  same(validateMusicConfig({ minMidi: NaN, maxMidi: Infinity, maxIntensity: -Infinity, panLimit: NaN }), DEFAULT_MUSIC_CONFIG);
  for (const note of [NaN, Infinity, 60.5, -1, 128]) throws(() => midiToFrequency(note), RangeError);
  throws(() => mapCelestialEventsToMusic(changeRoot({ x: Infinity })), RangeError);
});

test("Missing parents reject", () => {
  throws(() => mapCelestialEventsToMusic(tree.slice(1)), TypeError);
});

test("Duplicate IDs reject", () => {
  throws(() => mapCelestialEventsToMusic([tree[0], tree[0]]), TypeError);
});

test("Wrong and duplicate root associations reject", () => {
  throws(() => mapCelestialEventsToMusic([tree[0], { ...tree[1], rootId: "wrong" }]), TypeError);
  throws(() => mapCelestialEventsToMusic([tree[0], { ...tree[0], id: "duplicate root" }]), TypeError);
});

test("Negative times and early children reject", () => {
  throws(() => mapCelestialEventsToMusic(changeRoot({ startTime: -1 })), RangeError);
  throws(() => mapCelestialEventsToMusic([tree[0], { ...tree[1], startTime: 0 }]), TypeError);
});

test("Invalid duration and amplitude reject", () => {
  for (const fields of [{ duration: 0 }, { duration: Infinity }, { amplitude: -1 }, { amplitude: 1.01 }]) throws(() => mapCelestialEventsToMusic(changeRoot(fields)), RangeError);
});

test("Oversized batches reject", () => {
  throws(() => mapCelestialEventsToMusic(Array(301).fill(tree[0])), RangeError);
  throws(() => planMelodicVoices(Array(301).fill(dense[0])), RangeError);
});

test("JSON round-trip", () => {
  same(JSON.parse(JSON.stringify(mapped)), mapped);
  same(JSON.parse(JSON.stringify(ambient)), ambient);
});

test("Actual recursion integration preserves original contract", () => {
  const events = generateEchoTree(root, { maxDepth: 2 }, 5);
  equal(events.length, 7);
  equal(events[0].id, '["star"]');
  equal(events[1].parentId, events[0].id);
  const notes = mapCelestialEventsToMusic(events);
  equal(notes.length, 7);
  equal(notes[0].startTime, 5);
  equal(notes[0].celestialEventId, events[0].id);
});

test("Invalid geometry, IDs and depth reject", () => {
  for (const fields of [{ x: -0.2 }, { y: 1.1 }, { depth: 5 }, { radius: 0 }, { angle: NaN }]) throws(() => mapCelestialEventsToMusic(changeRoot(fields)), RangeError);
  throws(() => mapCelestialEventsToMusic(changeRoot({ id: "" })), TypeError);
  throws(() => mapCelestialEventsToMusic(Array(1)), TypeError);
});

test("Optional bounds and voice limits normalize", () => {
  equal(validateMusicConfig({ panLimit: 8, minMidi: 48.1 }).panLimit, 0.65);
  equal(validateMusicConfig({ panLimit: -1 }).panLimit, 0);
  equal(planMelodicVoices(dense, -2).retained.length, 1);
  equal(planMelodicVoices(dense, 80).retained.length, 8);
  equal(planMelodicVoices(dense, 2.6).retained.length, 3);
  equal(planMelodicVoices(dense, Infinity).retained.length, 8);
});

test("A child never moves by more than a fifth", () => {
  for (const note of mapped.slice(1)) { const parent = mapped.find(candidate => candidate.id === note.parentMusicalEventId);
  assert(Math.abs(note.midiNote - parent.midiNote) <= 7); };
});

test("Maximum trees keep unique musical IDs", () => {
  equal(new Set(mapped.map(note => note.id)).size, 121);
  assert(ambient.every(note => !mapped.some(candidate => candidate.id === note.id)));
});

summary.textContent = `${passed} passed, ${failed} failed (${passed + failed} total).`;
