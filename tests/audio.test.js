import { generateEchoTree } from "../js/recursion.js";
import { generateAmbientHarmony, mapCelestialEventsToMusic } from "../js/music.js";

const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, message = "Unexpected result") {
  if (!condition) throw new Error(message);
}

function equal(actual, expected) {
  assert(Object.is(actual, expected), `Expected ${expected}, received ${actual}`);
}

async function rejects(run, kind) {
  let caught;
  try { await run(); } catch (error) { caught = error; }
  assert(caught instanceof kind, `Expected ${kind.name}, received ${caught}`);
}

async function test(name, run) {
  const item = document.createElement("li");
  try {
    await run();
    passed += 1;
    item.textContent = `PASS: ${name}`;
  } catch (error) {
    failed += 1;
    item.textContent = `FAIL: ${name} (${error.message})`;
  }
  results.append(item);
}

function skip(name) {
  skipped += 1;
  const item = document.createElement("li");
  item.textContent = `SKIP: ${name}`;
  results.append(item);
}

const LiveContext = globalThis.AudioContext;
let creations = 0;
if (LiveContext) {
  globalThis.AudioContext = class extends LiveContext {
    constructor() { super(); creations += 1; }
  };
}
let audio;
try { audio = await import("../js/audio.js"); }
finally { if (LiveContext) globalThis.AudioContext = LiveContext; }
const {
  AudioEngine, DEFAULT_AUDIO_CONFIG, createAudioGraph, createSeededNoiseBuffer,
  createReverbImpulseResponse, renderCompositionOffline, scheduleInstrumentVoice, validateAudioConfig,
} = audio;
const root = { id: "test", x: 0.5, y: 0.5 };
const tree = (config, time) => mapCelestialEventsToMusic(generateEchoTree(root, config, time));
const rootNote = tree({ maxDepth: 0 })[0];
const echo = tree({ maxDepth: 1 })[1];
const [pad] = generateAmbientHarmony(undefined, 0, 1);
const dry = { reverbMix: 0, reverbDuration: 0.1, atmosphereEnabled: false, sampleRate: 22050, masterVolume: 1 };
const render = (notes = [], ambient = [], config = {}, duration = 1) =>
  renderCompositionOffline({ notes, ambient, duration }, { ...dry, ...config });
const dense = Array.from({ length: 10 }, (_, i) => ({ ...rootNote, id: `dense-${i}` }));

function measure(buffer, channel, from = 0, to = buffer.duration) {
  const samples = buffer.getChannelData(channel);
  const first = Math.floor(from * buffer.sampleRate);
  const end = Math.min(samples.length, Math.floor(to * buffer.sampleRate));
  let peak = 0;
  let energy = 0;
  for (let i = first; i < end; i += 1) {
    const sample = samples[i];
    assert(Number.isFinite(sample), "Non-finite audio sample");
    peak = Math.max(peak, Math.abs(sample));
    energy += sample * sample;
  }
  return { peak, energy };
}

await test("Module import and engine construction are inert", () => {
  equal(creations, 0);
  const engine = new AudioEngine();
  equal(engine.getState(), "idle");
  equal(engine.getPlaybackPosition(), 0);
  equal(engine.getDiagnostics().contextState, "uninitialized");
});
await test("Defaults, invalid numbers, clamping and input ownership", () => {
  assert(Object.isFrozen(DEFAULT_AUDIO_CONFIG));
  equal(JSON.stringify(validateAudioConfig()), JSON.stringify(DEFAULT_AUDIO_CONFIG));
  const config = Object.freeze({ masterVolume: NaN, reverbMix: Infinity, ambientVolume: -2, atmosphereVolume: 12 });
  const checked = validateAudioConfig(config);
  equal(checked.masterVolume, 0.3);
  equal(checked.reverbMix, 0.2);
  equal(checked.ambientVolume, 0);
  equal(checked.atmosphereVolume, 1);
  equal(config.ambientVolume, -2);
});
await test("Event validation rejects invalid intervals, instruments, and batches", async () => {
  const engine = new AudioEngine();
  for (const fields of [{ frequency: NaN }, { duration: -1 }, { startTime: Infinity }, { intensity: 1 },
    { pan: 2 }, { instrument: "constructor" }, { id: "" }]) {
    await rejects(() => engine.loadComposition({ notes: [{ ...rootNote, ...fields }] }), TypeError);
  }
  await rejects(() => engine.loadComposition({ notes: [rootNote, rootNote] }), TypeError);
  await rejects(() => engine.loadComposition({ notes: Array(301).fill(rootNote) }), RangeError);
  await rejects(() => engine.loadComposition({ ambient: [pad, pad, pad] }), RangeError);
  const frozen = Object.freeze({ ...rootNote });
  engine.loadComposition({ notes: Object.freeze([frozen]) });
  equal(frozen.id, rootNote.id);
  equal(engine.getState(), "stopped");
  equal(engine.getDiagnostics().contextState, "uninitialized");
  await engine.dispose();
});

if (!globalThis.OfflineAudioContext) {
  skip("Offline synthesis and signal checks require OfflineAudioContext");
} else {
  for (const [name, note] of [["starlight", rootNote], ["echo", echo], ["nebula-pad", pad]]) {
    await test(`${name} generates finite, bounded audio`, async () => {
      const adjusted = Object.freeze({ ...note, startTime: 0, duration: 0.5 });
      const buffer = await render(name === "nebula-pad" ? [] : [adjusted], name === "nebula-pad" ? [adjusted] : []);
      for (let channel = 0; channel < 2; channel += 1) {
        const { peak } = measure(buffer, channel);
        assert(peak > 0.0001 && peak < 0.2, `Unexpected peak ${peak}`);
      }
    });
  }
  await test("Zero intensity and zero master are silent", async () => {
    const silent = await render([{ ...rootNote, intensity: 0 }]);
    const muted = await render([rootNote], [pad], { masterVolume: 0, atmosphereEnabled: true, reverbMix: 0.5 });
    for (const buffer of [silent, muted]) for (const channel of [0, 1]) equal(measure(buffer, channel).peak, 0);
  });
  await test("Onset, pre-onset silence, release and cleanup", async () => {
    const context = new OfflineAudioContext(2, 22050, 22050);
    let cleaned = 0;
    scheduleInstrumentVoice(context, context.destination, rootNote, 0.15, 0.4, () => { cleaned += 1; });
    const buffer = await context.startRendering();
    equal(measure(buffer, 0, 0, 0.149).peak, 0);
    assert(measure(buffer, 0, 0.16, 0.20).peak > 0.001);
    assert(measure(buffer, 0, 0.56, 0.70).peak > 0.0001);
    assert(measure(buffer, 0, 0.78, 1).peak < 1e-7);
    // The offline context dispatches ended on the browser task queue.
    for (let i = 0; i < 20 && !cleaned; i += 1) await new Promise(resolve => setTimeout(resolve, 5));
    equal(cleaned, 1);
  });
  await test("Stereo pan changes both channel energies", async () => {
    const left = await render([{ ...rootNote, pan: -0.65 }]);
    const right = await render([{ ...rootNote, pan: 0.65 }]);
    assert(measure(left, 0).energy > 2 * measure(left, 1).energy);
    assert(measure(right, 1).energy > 2 * measure(right, 0).energy);
  });
  await test("Seeded noise is bounded, repeatable, and changes with seed", () => {
    const context = new OfflineAudioContext(2, 22050, 22050);
    const a = createSeededNoiseBuffer(context, 200, 4);
    const b = createSeededNoiseBuffer(context, 4, 4);
    const c = createSeededNoiseBuffer(context, 4, 12);
    equal(a.length, 4 * context.sampleRate);
    equal(a.numberOfChannels, 1);
    equal(a.getChannelData(0)[0], 0);
    assert(Math.abs(a.getChannelData(0)[a.length - 1]) === 0);
    assert(measure(a, 0).peak <= 1);
    assert(a.getChannelData(0).every((sample, i) => sample === b.getChannelData(0)[i]));
    assert(a.getChannelData(0).some((sample, i) => sample !== c.getChannelData(0)[i]));
  });
  await test("Stereo impulse has bounded, reproducible, decaying energy", () => {
    const context = new OfflineAudioContext(2, 22050, 22050);
    const a = createReverbImpulseResponse(context, 100, 7);
    const b = createReverbImpulseResponse(context, 4, 7);
    equal(a.numberOfChannels, 2);
    equal(a.duration, 4);
    for (const channel of [0, 1]) {
      assert(measure(a, channel).peak <= 1);
      assert(measure(a, channel, 0, 0.5).energy > 30 * measure(a, channel, 3.5, 4).energy);
      assert(a.getChannelData(channel).every((sample, i) => sample === b.getChannelData(channel)[i]));
    }
  });
  await test("Reverb contributes a tail and atmosphere can be disabled", async () => {
    const note = { ...rootNote, duration: 0.4 };
    const off = await render([note], [], { reverbDuration: 1 });
    const on = await render([note], [], { reverbDuration: 1, reverbMix: 0.4 });
    equal(measure(off, 0, 0.7, 1).peak, 0);
    assert(measure(on, 0, 0.7, 1).peak > 0.00001);
    equal(measure(await render(), 0).peak, 0);
    assert(measure(await render([], [], { atmosphereEnabled: true }), 0).peak > 0.00001);
  });
  await test("Master volume reduction lowers energy", async () => {
    const a = await render([rootNote], [pad]);
    const b = await render([rootNote], [pad], { masterVolume: 0.25 });
    for (const channel of [0, 1]) assert(measure(a, channel).energy > 10 * measure(b, channel).energy);
  });
  await test("Maximum-load peaks stay below 0.95 in both channels", async () => {
    const notes = dense.map(note => ({ ...note, intensity: 0.7, pan: -0.65 }));
    const pads = generateAmbientHarmony(undefined, 0, 1).map(note => ({ ...note, intensity: 0.7 }));
    const peaks = [0, 0];
    for (const reverbMix of [0, 0.2, 1]) {
      const buffer = await render(notes, pads, {
        reverbMix, reverbDuration: 2.5, atmosphereEnabled: true, atmosphereVolume: 1, ambientVolume: 1,
        sampleRate: 44100,
      });
      for (const channel of [0, 1]) {
        peaks[channel] = Math.max(peaks[channel], measure(buffer, channel).peak);
        assert(peaks[channel] <= 0.95, `Channel ${channel} peak ${peaks[channel]}`);
      }
    }
    const measurement = document.createElement("p");
    measurement.id = "stress-peaks";
    measurement.textContent = `Stress peaks L=${peaks[0].toFixed(6)} R=${peaks[1].toFixed(6)}`;
    document.body.append(measurement);
  });
  await test("Offline release-aware suppression preserves the first sounding voice", async () => {
    const a = { ...rootNote, duration: 0.4 };
    const b = { ...echo, startTime: 0.45, duration: 0.4 };
    const limited = await render([b, a], [], { maxMelodicVoices: 1 });
    const one = await render([a], [], { maxMelodicVoices: 1 });
    equal(measure(limited, 0).energy, measure(one, 0).energy);
    const both = await render([a, b], [], { maxMelodicVoices: 2 });
    assert(measure(both, 0, 0.63, 0.85).energy > 0);
  });
  await test("Offline format, tail, boundary and duration limits", async () => {
    const buffer = await render([rootNote], [], { sampleRate: 32000, reverbDuration: 4 }, 0.5);
    assert(buffer instanceof AudioBuffer);
    equal(buffer.numberOfChannels, 2);
    equal(buffer.sampleRate, 32000);
    equal(buffer.length, 4.5 * 32000);
    const off = await render([{ ...rootNote, startTime: 0.5 }], [], {}, 0.5);
    equal(measure(off, 0).peak, 0);
    assert(measure(buffer, 0, 0.8, 1).peak === 0);
    for (const duration of [0, Infinity, 61]) await rejects(() => render([], [], {}, duration), RangeError);
  });
  await test("Matching offline renders reproduce samples within tolerance", async () => {
    const settings = { atmosphereEnabled: true, reverbMix: 0.2 };
    const a = await render([rootNote], [pad], settings);
    const b = await render([rootNote], [pad], settings);
    for (const channel of [0, 1]) {
      const reference = b.getChannelData(channel);
      assert(a.getChannelData(channel).every((sample, i) => Math.abs(sample - reference[i]) < 1e-6));
    }
  });
  await test("Shared graph accepts a destination and dry mixer settings", () => {
    const context = new OfflineAudioContext(2, 22050, 22050);
    const graph = createAudioGraph(context, context.destination, dry);
    equal(graph.wet.gain.value, 0);
    equal(graph.dry.gain.value, 1);
    graph.disconnect();
  });
  await test("Default binary and maximum ternary recursion render audible samples", async () => {
    for (const config of [undefined, { maxDepth: 4, childrenPerStar: 3 }]) {
      const notes = tree(config);
      equal(notes.length, config ? 121 : 15);
      const buffer = await render(notes, [pad], {}, 4.5);
      assert(measure(buffer, 0).peak > 0.001 && measure(buffer, 1).peak > 0.001);
    }
  });
  await test("Mapped timing, IDs, and frequency survive actual synthesis", async () => {
    const notes = tree({ maxDepth: 1, tempo: 80 }, 0.25);
    equal(notes[0].celestialEventId, '["test"]');
    assert(Math.abs(notes[1].startTime - 0.80) < 1e-10);
    const [note] = notes;
    const buffer = await render([note], [], {}, 1);
    equal(measure(buffer, 0, 0, 0.249).peak, 0);
    assert(measure(buffer, 0, 0.27, 0.40).peak > 0.001);
    const samples = buffer.getChannelData(0);
    let crossings = 0;
    for (let i = Math.ceil(buffer.sampleRate * 0.37); i < buffer.sampleRate * 0.57; i += 1) {
      if (samples[i - 1] < 0 && samples[i] >= 0) crossings += 1;
    }
    assert(Math.abs(crossings / 0.2 - note.frequency) < 7, `Measured ${crossings / 0.2} Hz`);
  });
}

// The headless run opts in with an autoplay override. Normal browser visits never start live audio.
if (new URLSearchParams(location.search).get("live") !== "1" || !LiveContext) {
  skip("Live transport checks require the headless autoplay override or an equivalent test browser policy");
} else {
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  async function waitFor(condition, diagnostic) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (condition()) return;
      await wait(35);
    }
    throw new Error(diagnostic());
  }
  await test("Live controls, timers, composed voice limits, pause, replay and stop", async () => {
    const engine = new AudioEngine({ reverbDuration: 0.1, masterVolume: 0 });
    try {
      await rejects(() => engine.play(), Error);
      await engine.pause();
      await engine.resume();
      const trees = [0, 1].flatMap(index => mapCelestialEventsToMusic(
        generateEchoTree({ ...root, id: `live-${index}` }, { maxDepth: 2, childrenPerStar: 3, generationDelay: 0.4 }),
      ));
      engine.loadComposition({ notes: trees, ambient: generateAmbientHarmony(undefined, 0, 2), duration: 2 });
      await Promise.all([engine.play(), engine.play()]);
      equal(engine.getState(), "playing");
      await waitFor(() => engine.getPlaybackPosition() >= 0.92, () => JSON.stringify(engine.getDiagnostics()));
      const active = engine.getDiagnostics();
      assert(active.peakMelodicVoiceCount <= 8 && active.peakMelodicVoiceCount > 0);
      assert(active.activeMelodicVoiceCount <= 8);
      equal(active.ambientVoiceCount, 2);
      equal(active.atmosphereLayerCount, 1);
      assert(active.suppressed.some(event => event.reason === "voice-limit" && typeof event.id === "string"));
      await engine.pause();
      const paused = engine.getPlaybackPosition();
      assert(paused > 0 && paused < 2);
      await wait(70);
      equal(engine.getPlaybackPosition(), paused);
      await engine.resume();
      await waitFor(() => engine.getPlaybackPosition() > paused, () => JSON.stringify(engine.getDiagnostics()));
      assert(engine.getPlaybackPosition() > paused);
      engine.stop();
      equal(engine.getPlaybackPosition(), 0);
      equal(engine.getDiagnostics().scheduledVoiceCount, 0);
      equal(engine.getDiagnostics().ambientVoiceCount, 0);
      equal(engine.getDiagnostics().atmosphereLayerCount, 0);
      await engine.play();
      equal(engine.getState(), "playing");
    } finally { await engine.dispose(); }
    await engine.dispose();
    equal(engine.getState(), "disposed");
    equal(engine.getDuration(), 0);
    equal(engine.getDiagnostics().scheduledVoiceCount, 0);
  });
  await test("Completed voices release their registry entry before natural completion", async () => {
    const engine = new AudioEngine({ reverbDuration: 0.1, atmosphereEnabled: false, masterVolume: 0 });
    try {
      engine.loadComposition({ notes: [rootNote], duration: 0.42 });
      await engine.play();
      await waitFor(() => engine.getDiagnostics().scheduledVoiceCount === 0, () => JSON.stringify(engine.getDiagnostics()));
      equal(engine.getDiagnostics().scheduledVoiceCount, 0);
      equal(engine.getDiagnostics().retainedMelodic, 1);
      equal(engine.getState(), "playing");
      await waitFor(() => engine.getState() === "stopped", () => JSON.stringify(engine.getDiagnostics()));
      equal(engine.getState(), "stopped");
      equal(engine.getPlaybackPosition(), 0.42);
    } finally { await engine.dispose(); }
  });
  await test("Stop and disposal cancel in-flight play and resume", async () => {
    const engine = new AudioEngine({ atmosphereEnabled: false, masterVolume: 0 });
    try {
      engine.loadComposition({ notes: [rootNote], duration: 1 });
      const starting = engine.play();
      engine.stop();
      await starting;
      equal(engine.getState(), "stopped");
      await engine.play();
      await engine.pause();
      const resuming = engine.resume();
      await engine.dispose();
      await resuming;
      equal(engine.getState(), "disposed");
      equal(engine.getDiagnostics().scheduledVoiceCount, 0);
    } finally { await engine.dispose(); }
  });
}

summary.textContent = `${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total).`;
