import { AudioEngine, renderCompositionOffline } from "../js/audio.js";
import { VisualEngine } from "../js/visuals.js";

const summary = document.querySelector("#summary");
const results = document.querySelector("#results");
let passed = 0;
let failed = 0;
let skipped = 0;

function assert(value, message = "Unexpected result") {
  if (!value) throw new Error(message);
}

function equal(actual, expected) {
  assert(Object.is(actual, expected), `Expected ${expected}, received ${actual}`);
}

async function test(name, run) {
  const row = document.createElement("li");
  try {
    await run();
    passed += 1;
    row.textContent = `PASS: ${name}`;
  } catch (error) {
    failed += 1;
    row.textContent = `FAIL: ${name} (${error.message})`;
  }
  results.append(row);
}

function skip(name) {
  skipped += 1;
  const row = document.createElement("li");
  row.textContent = `SKIP: ${name}`;
  results.append(row);
}

const Native = globalThis.AudioContext;
let contexts = 0;
if (Native) globalThis.AudioContext = class extends Native { constructor() { super(); contexts += 1; } };
let api;
try { api = await import("../js/controller.js"); }
finally { if (Native) globalThis.AudioContext = Native; }
const { CosmicEchoesController, DEFAULT_CONTROLLER_CONFIG, validateControllerConfig } = api;

function fixture(config) {
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 220, height: 140 });
  return new CosmicEchoesController(canvas, {
    duration: 12, ...config,
    audio: { reverbDuration: 0.1, ...config?.audio },
    visuals: { particles: false, ...config?.visuals },
  });
}

async function withController(config, run) {
  const controller = fixture(config);
  controller.setMonitoringVolume(0);
  try { await run(controller); }
  finally { await controller.dispose(); }
}

function matchError(run, pattern) {
  let caught;
  try { run(); } catch (error) { caught = error; }
  assert(caught && pattern.test(caught.message), `Expected error matching ${pattern}`);
}

async function waitFor(condition, detail) {
  for (let i = 0; i < 140; i += 1) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(detail);
}

async function untilTime(controller, seconds) {
  await waitFor(() => controller.getPlaybackPosition() >= seconds, `Audio clock did not reach ${seconds}`);
}

await test("Import and construction are inert, and nested optional settings are validated", async () => {
  equal(contexts, 0);
  assert(Object.isFrozen(DEFAULT_CONTROLLER_CONFIG));
  const input = Object.freeze({ duration: Infinity, placementLead: NaN, recordingCapacity: 500,
    audio: Object.freeze({ schedulingHorizon: 0.25 }), environment: "solar-harmony" });
  const config = validateControllerConfig(input);
  equal(config.duration, 60);
  equal(config.placementLead, 0.29);
  equal(config.recordingCapacity, 300);
  equal(config.music.scaleId, "f-major-pentatonic");
  equal(config.visuals.theme, "solar-harmony");
  equal(input.recordingCapacity, 500);
  matchError(() => validateControllerConfig({ environment: "constructor" }), /environment/);
  matchError(() => new CosmicEchoesController(null), /Canvas/);
  const c = fixture();
  equal(c.getState(), "idle");
  equal(c.getDiagnostics().audio.contextState, "uninitialized");
  equal(c.placeStar(0.5, 0.5).reason, "invalid-state");
  equal(c.getCompositionSnapshot(), null);
  await c.dispose();
  await c.dispose();
  equal(c.getState(), "disposed");
});

if (new URLSearchParams(location.search).get("live") !== "1" || !Native) {
  skip("Live integration groups require a browser autoplay override or equivalent test policy");
} else {
  await test("Live depth-zero, binary and ternary placements share IDs, time and audio layers", () =>
    withController({ environment: "nebula-dreams" }, async c => {
      assert(await c.startSession());
      equal(await c.startSession(), false);
      const start = c.getPlaybackPosition();
      c.setRecursionConfig({ maxDepth: 0 });
      const one = c.placeStar(0.5, 0.5);
      assert(one.accepted);
      equal(one.eventCount, 1);
      assert(one.onset >= start + 0.15);
      c.setRecursionConfig({ tempo: 80 });
      const two = c.placeStar(0.2, 0.4);
      equal(two.eventCount, 15);
      c.setRecursionConfig({ maxDepth: 4, childrenPerStar: 3 });
      equal(c.placeStar(0.8, 0.5).eventCount, 121);
      equal(c.placeStar(Infinity, 0).reason, "invalid-coordinates");
      const snapshot = c.getCompositionSnapshot();
      equal(new Set(snapshot.placements.map(root => root.id)).size, 3);
      equal(snapshot.placements[0].recursion.maxDepth, 0);
      equal(snapshot.placements[1].music.scaleId, "a-minor-pentatonic");
      const { events, notes } = snapshot.placements[1];
      assert(Math.abs(events[1].startTime - events[0].startTime - 0.55) < 1e-8);
      for (const note of notes) {
        const event = events.find(item => item.id === note.celestialEventId);
        equal(note.startTime, event.startTime);
        if (event.parentId) assert(notes.some(parent => parent.celestialEventId === event.parentId && note.parentMusicalEventId === parent.id));
      }
      await untilTime(c, one.onset + 0.1);
      const d = c.getDiagnostics();
      equal(d.visual.theme, "nebula-dreams");
      equal(d.audio.ambientVoiceCount, 2);
      equal(d.audio.atmosphereLayerCount, 1);
      assert(d.active > 0 && d.audio.retainedMelodic > 0);
      assert(d.visualTime <= d.position + 1e-8);
      matchError(() => c.setEnvironment("deep-space"), /Stop/);
    }));

  await test("Audio and visual transaction failures leave no partial recording or queued notes", () =>
    withController({ recursion: { maxDepth: 0 } }, async c => {
      await c.startSession();
      const visualAdd = VisualEngine.prototype.addEvents;
      const audioAppend = AudioEngine.prototype.appendNotes;
      try {
        AudioEngine.prototype.appendNotes = () => { throw new Error("Injected audio rejection"); };
        equal(c.placeStar(0.5, 0.5).reason, "integration-failure");
        AudioEngine.prototype.appendNotes = audioAppend;
        VisualEngine.prototype.addEvents = () => { throw new Error("Injected visual rejection"); };
        equal(c.placeStar(0.5, 0.5).reason, "integration-failure");
      } finally {
        VisualEngine.prototype.addEvents = visualAdd;
        AudioEngine.prototype.appendNotes = audioAppend;
      }
      equal(c.getDiagnostics().occupied, 0);
      equal(c.getCompositionSnapshot().placements.length, 0);
      await untilTime(c, 0.35);
      equal(c.getDiagnostics().audio.retainedMelodic, 0);
      assert(c.placeStar(0.5, 0.5).accepted);
    }));

  await test("Exact shared capacity, atomic excess rejection, expiry and historical cap", () =>
    withController({}, async c => {
      await c.startSession();
      for (const [maxDepth, childrenPerStar] of [[4, 3], [4, 3], [4, 2], [3, 2], [2, 2], [1, 2], [0, 2], [0, 2]]) {
        c.setRecursionConfig({ maxDepth, childrenPerStar });
        assert(c.placeStar(0.5, 0.5).accepted);
      }
      equal(c.getDiagnostics().occupied, 300);
      equal(c.getDiagnostics().recordedEvents, 300);
      equal(c.placeStar(0.3, 0.6).reason, "event-capacity");
      await untilTime(c, 1.6);
      assert(c.getDiagnostics().occupied < 300);
      equal(c.placeStar(0.3, 0.6).reason, "recording-capacity");
      equal(c.getDiagnostics().recordedEvents, 300);
      equal(c.getCompositionSnapshot().placements.length, 8);
    }));

  await test("Short sessions and configured recording limits reject full trees", async () => {
    await withController({ duration: 0.8 }, async c => {
      await c.startSession();
      equal(c.placeStar(0.5, 0.5).reason, "session-duration");
      equal(c.getDiagnostics().recordedEvents, 0);
    });
    await withController({ recordingCapacity: 1 }, async c => {
      await c.startSession();
      equal(c.placeStar(0.5, 0.5).reason, "recording-capacity");
    });
  });

  await test("Audio-authoritative pause and resume, finalization and immutable replay", () =>
    withController({ recursion: { maxDepth: 1, generationDelay: 0.4 } }, async c => {
      await c.startSession();
      const first = c.placeStar(0.5, 0.5);
      await untilTime(c, first.onset + 0.12);
      assert(await c.pause());
      const paused = c.getDiagnostics();
      equal(paused.position, paused.visualTime);
      equal(c.placeStar(0.5, 0.5).reason, "invalid-state");
      await new Promise(resolve => setTimeout(resolve, 45));
      equal(c.getPlaybackPosition(), paused.position);
      assert(await c.resume());
      await untilTime(c, paused.position + 0.05);
      c.stop();
      equal(c.getState(), "stopped");
      equal(c.getDiagnostics().audio.scheduledVoiceCount, 0);
      const record = c.getCompositionSnapshot();
      assert(record.interrupted.some(note => note.id === record.placements[0].notes[0].id));
      assert(record.cancelled.some(note => note.id === record.placements[0].notes[1].id));
      const json = JSON.stringify(record);
      record.placements[0].x = -100;
      equal(JSON.stringify(c.getCompositionSnapshot()), json);
      const offline = c.getOfflineCompositionInput();
      assert(offline.composition.hardEnd);
      equal(offline.composition.notes.length, 1);
      equal(offline.config.masterVolume, 0.3);
      const buffer = await renderCompositionOffline(offline.composition, offline.config);
      equal(buffer.numberOfChannels, 2);
      let audible = false;
      for (const sample of buffer.getChannelData(0)) { assert(Number.isFinite(sample)); audible ||= Math.abs(sample) > 0.00001; }
      assert(audible);
      assert(Math.abs(buffer.duration - offline.composition.duration) <= 1 / buffer.sampleRate);
      c.setRecursionConfig({ maxDepth: 4 });
      c.setEnvironment("solar-harmony");
      assert(await c.replay());
      equal(c.getDiagnostics().visual.theme, "deep-space");
      equal(c.getDiagnostics().occupied, 3);
      equal(c.placeStar(0.5, 0.5).reason, "invalid-state");
      await waitFor(() => c.getState() === "completed", "Replay did not finish");
      equal(JSON.stringify(c.getCompositionSnapshot()), json);
      c.reset();
      equal(c.getCompositionSnapshot(), null);
      equal(c.getState(), "idle");
    }));

  await test("Release-aware combined voice suppression preserves celestial events and journal IDs", () =>
    withController({ recursion: { maxDepth: 0 } }, async c => {
      await c.startSession();
      for (let i = 0; i < 12; i += 1) assert(c.placeStar(i / 12, 0.5).accepted);
      await untilTime(c, 0.45);
      const d = c.getDiagnostics();
      equal(d.audio.peakMelodicVoiceCount, 8);
      equal(d.active, 12);
      equal(d.audio.ambientVoiceCount, 2);
      equal(d.audio.atmosphereLayerCount, 1);
      c.stop();
      const record = c.getCompositionSnapshot();
      const notes = record.admitted.filter(note => note.role !== "ambient");
      equal(notes.length, 8);
      assert(record.suppressed.length >= 4);
      assert(record.suppressed.every(note => note.reason === "voice-limit"));
      assert(record.suppressed.every(note => record.placements.some(root => root.events.some(event => event.id === note.celestialEventId))));
      equal(c.getOfflineCompositionInput().composition.notes.length, 8);
    }));

  await test("Natural completion retains endpoint and stale initialization cannot revive a reset or disposed controller", async () => {
    await withController({ duration: 0.6 }, async c => {
      await c.startSession();
      await waitFor(() => c.getState() === "completed", "Session did not complete naturally");
      equal(c.getCompositionSnapshot().termination, "completed");
      equal(c.getCompositionSnapshot().endpoint, 0.6);
      equal(c.getOfflineCompositionInput().composition.hardEnd, false);
    });
    await withController({}, async c => {
      const pending = c.startSession();
      c.reset();
      equal(await pending, false);
      equal(c.getState(), "idle");
      equal(c.getCompositionSnapshot(), null);
      const restarting = c.startSession();
      await c.dispose();
      equal(await restarting, false);
      equal(c.getState(), "disposed");
    });
  });
}

summary.textContent = `${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total).`;
