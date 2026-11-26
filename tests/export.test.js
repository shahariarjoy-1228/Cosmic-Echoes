import { CosmicEchoesController } from "../js/controller.js";
import { renderCompositionOffline } from "../js/audio.js";

const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
let passed = 0;
let failed = 0;
let skipped = 0;

function assert(value, message = "Unexpected result") { if (!value) throw new Error(message); }
function equal(actual, expected) {
  assert(Object.is(actual, expected), `Expected ${expected}, received ${actual}`);
}
async function rejects(action, pattern) {
  let error;
  try { await action(); } catch (caught) { error = caught; }
  assert(error && pattern.test(error.message), `Expected ${pattern}, received ${error}`);
}

async function test(name, callback) {
  const item = document.createElement("li");
  try { await callback(); passed += 1; item.textContent = `PASS: ${name}`; }
  catch (error) { failed += 1; item.textContent = `FAIL: ${name} (${error.message})`; }
  results.append(item);
}

function skip(name) {
  const item = document.createElement("li");
  item.textContent = `SKIP: ${name}`;
  results.append(item);
  skipped += 1;
}

const Context = globalThis.AudioContext;
let created = 0;
if (Context) globalThis.AudioContext = class extends Context { constructor() { super(); created += 1; } };
let api;
try { api = await import("../js/export.js"); }
finally { if (Context) globalThis.AudioContext = Context; }
const { WAV_EXPORT_DEFAULTS, WavExporter, createExportFilename, createWavBlob, encodeWavPCM16,
  floatToPcm16, validateAudioBuffer } = api;

function fixture(left = [-1, 0.5, 0], right = [1, -0.25, 0.25], sampleRate = 44100) {
  const channels = [Float32Array.from(left), Float32Array.from(right)];
  return { sampleRate, length: left.length, numberOfChannels: 2, duration: left.length / sampleRate,
    getChannelData: channel => channels[channel] };
}

function recording() {
  const input = { composition: { notes: [], ambient: [], duration: 1 }, config: { seed: 53, masterVolume: 0.3 } };
  const snapshot = { endpoint: 1, environment: "deep-space", sessionId: "session-1" };
  return { input, snapshot, getOfflineCompositionInput: () => input, getCompositionSnapshot: () => snapshot };
}

function header(bytes) {
  const view = new DataView(bytes);
  const tag = offset => String.fromCharCode(...new Uint8Array(bytes, offset, 4));
  return {
    riff: tag(0), riffSize: view.getUint32(4, true), wave: tag(8), fmt: tag(12), fmtSize: view.getUint32(16, true),
    format: view.getUint16(20, true), channels: view.getUint16(22, true), sampleRate: view.getUint32(24, true),
    byteRate: view.getUint32(28, true), align: view.getUint16(32, true), depth: view.getUint16(34, true),
    data: tag(36), dataBytes: view.getUint32(40, true), views: view,
  };
}

await test("Import and construction are inert, PCM endpoint and signed rounding rules hold", () => {
  equal(created, 0);
  assert(Object.isFrozen(WAV_EXPORT_DEFAULTS));
  equal(new WavExporter().getStatus().state, "idle");
  for (const [input, value] of [[-1,-32768],[1,32767],[0,0],[-0.5,-16384],[0.5,16384],
    [-2,-32768],[2,32767],[NaN,0],[Infinity,0],[-Infinity,0],[-0.000001,0]]) {
    equal(floatToPcm16(input), value);
  }
});

await test("Independent parser reads every PCM header field and exact RIFF sizes", () => {
  const { bytes, metadata } = encodeWavPCM16(fixture(undefined, undefined, 32000));
  const h = header(bytes);
  equal(h.riff,"RIFF"); equal(h.wave,"WAVE"); equal(h.fmt,"fmt "); equal(h.data,"data");
  equal(h.riffSize, 48); equal(h.fmtSize, 16); equal(h.format, 1); equal(h.channels, 2);
  equal(h.sampleRate, 32000); equal(h.byteRate, 128000); equal(h.align, 4); equal(h.depth, 16);
  equal(h.dataBytes, 12); equal(bytes.byteLength, 56);
  equal(h.views.getUint8(28), 0x00);
  equal(h.views.getUint8(29), 0xf4);
  equal(metadata.frameCount, 3);
});

await test("Every frame is interleaved left/right without mutating the source", () => {
  const source = fixture();
  const { bytes } = encodeWavPCM16(source);
  const view = new DataView(bytes);
  [-32768, 32767, 16384, -8192, 0, 8192].forEach((value, index) => equal(view.getInt16(44 + index * 2, true), value));
  equal(bytes.byteLength, 44 + 6 * 2);
  equal(source.getChannelData(0)[1], 0.5);
  equal(source.getChannelData(1)[1], -0.25);
});

await test("Malformed or oversized audio is rejected before unsafe allocation", async () => {
  await rejects(() => validateAudioBuffer(null), /stereo/);
  for (const fields of [{ numberOfChannels: 1 }, { length: 0 }, { sampleRate: NaN },
    { sampleRate: 96000 }, { duration: Infinity }, { length: 44100 * 65 }, { length: 2 ** 32 }]) {
    await rejects(() => validateAudioBuffer({ ...fixture(), ...fields }), /stereo|duration/);
  }
  await rejects(() => validateAudioBuffer(fixture([0, 0], [0])), /channel data/);
  await rejects(() => encodeWavPCM16(fixture([NaN], [0])), /non-finite/i);
  equal(encodeWavPCM16(fixture([4, -5], [1, 0])).metadata.clippedSamples, 2);
});

await test("Blob size, filename safety, fallback and limits", async () => {
  const result = createWavBlob(fixture(), { filename: "../evil/\u0001name.wav" });
  equal(result.blob.type, "audio/wav");
  equal(result.blob.size, 56);
  equal((await result.blob.arrayBuffer()).byteLength, result.byteLength);
  equal(result.filename, "cosmic-echoes-evil-name.wav");
  equal(createExportFilename(), "cosmic-echoes-composition.wav");
  equal(createExportFilename({ environment: "Nebula Dreams", sessionId: "001" }), "cosmic-echoes-nebula-dreams-001.wav");
  assert(createExportFilename({ filename: "a".repeat(1000) }).length <= 90);
});

await test("Independent browser decoding preserves PCM tolerances, channels and duration", async () => {
  const left = [0.5, -0.5, -1, 0.25];
  const right = [-0.25, 0.25, 0.125, -0.125];
  const output = createWavBlob(fixture(left, right));
  const context = new OfflineAudioContext(2, 4, 44100);
  const decoded = await context.decodeAudioData(await output.blob.arrayBuffer());
  equal(decoded.numberOfChannels, 2);
  equal(decoded.length, 4);
  equal(decoded.sampleRate, 44100);
  assert(Math.abs(decoded.duration - output.duration) <= 1 / 44100);
  [left,right].forEach((values, channel) => values.forEach((value, i) =>
    assert(Math.abs(decoded.getChannelData(channel)[i] - value) <= 2 / 32768)));
});

await test("Eligibility failures report missing, active, empty and malformed recordings", async () => {
  const exporter = new WavExporter({ render: async () => fixture() });
  const source = recording();
  await rejects(() => exporter.prepare(), /controller/);
  await rejects(() => exporter.prepare({ ...source, getCompositionSnapshot: () => null }), /Record a composition/);
  source.snapshot.endpoint = null;
  await rejects(() => exporter.prepare(source), /Stop the recording/);
  source.snapshot.endpoint = 0;
  await rejects(() => exporter.prepare(source), /positive duration/);
  source.snapshot.endpoint = 2;
  await rejects(() => exporter.prepare(source), /offline input/);
  equal(exporter.getStatus().state, "error");
});

await test("Prepare captures settings once, rejects overlap, replaces the result and handles errors", async () => {
  let finish;
  let captured;
  let calls = 0;
  const exporter = new WavExporter({ render: (composition, config) => {
    captured = { composition, config };
    calls += 1;
    return new Promise(resolve => { finish = resolve; });
  } });
  const source = recording();
  const first = exporter.prepare(source);
  equal(exporter.getStatus().state, "rendering");
  await rejects(() => exporter.prepare(source), /already running/);
  equal(calls, 1);
  source.input.config.seed = 999;
  source.input.composition.duration = 21;
  equal(captured.config.seed, 53);
  equal(captured.config.sampleRate, 44100);
  equal(captured.composition.duration, 1);
  finish(fixture());
  const result = await first;
  equal(exporter.getStatus().state, "ready");
  equal(exporter.getResult(), result);
  const next = exporter.prepare(recording());
  equal(exporter.getResult(), null);
  finish(fixture([NaN], [0]));
  await rejects(() => next, /non-finite/i);
  equal(exporter.getStatus().state, "error");
  const broken = new WavExporter({ render: async () => { throw new Error("Offline failure"); } });
  await rejects(() => broken.prepare(recording()), /Offline failure/);
  equal(broken.getStatus().message, "Offline failure");
});

await test("Cancelled and disposed renders cannot publish stale results", async () => {
  let finish;
  const exporter = new WavExporter({ render: () => new Promise(resolve => { finish = resolve; }) });
  const first = exporter.prepare(recording());
  assert(exporter.cancel());
  equal(exporter.getStatus().state, "cancelled");
  assert(exporter.getStatus().busy);
  await rejects(() => exporter.prepare(recording()), /already running/);
  finish(fixture());
  equal(await first, null);
  assert(!exporter.getStatus().busy);
  equal(exporter.getResult(), null);
  const next = exporter.prepare(recording());
  exporter.dispose();
  exporter.dispose();
  finish(fixture());
  equal(await next, null);
  equal(exporter.getStatus().state, "disposed");
  await rejects(() => exporter.prepare(recording()), /disposed/);
});

await test("Missing download capability and object URL lease cleanup are explicit", async () => {
  const exporter = new WavExporter({ render: async () => fixture() });
  await rejects(() => exporter.download(), /Prepare/);
  await exporter.prepare(recording());
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalClick = HTMLAnchorElement.prototype.click;
  let creations = 0;
  let clicks = 0;
  let revoked = 0;
  try {
    URL.createObjectURL = undefined;
    await rejects(() => exporter.download(), /does not support/);
    URL.createObjectURL = () => { creations += 1; return "blob:test"; };
    URL.revokeObjectURL = value => { equal(value, "blob:test"); revoked += 1; };
    HTMLAnchorElement.prototype.click = function () { assert(this.download.endsWith(".wav")); clicks += 1; };
    exporter.download();
    exporter.download();
    equal(creations, 1);
    equal(clicks, 2);
    equal(exporter.getStatus().message, "Download requested.");
    exporter.clear();
    exporter.dispose();
    equal(revoked, 0);
    for (let i = 0; i < 100 && !revoked; i += 1) await new Promise(resolve => setTimeout(resolve, 30));
    equal(revoked, 1);
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    HTMLAnchorElement.prototype.click = originalClick;
  }
});

async function waitFor(check, description) {
  for (let i = 0; i < 180; i += 1) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error(description);
}
function controller(config) {
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () => ({ width: 200, height: 120 });
  const c = new CosmicEchoesController(canvas, config);
  c.setMonitoringVolume(0);
  return c;
}

if (new URLSearchParams(location.search).get("live") !== "1" || !Context) {
  skip("Live controller exports require the explicit headless autoplay override or equivalent policy");
} else {
  await test("Early-stop export preserves effective admitted content and never restarts the live engine", async () => {
    const c = controller({ duration: 3, environment: "solar-harmony", recursion: { maxDepth: 1, generationDelay: 0.8 },
      audio: { seed: 937, sampleRate: 32000, reverbDuration: 0.1 } });
    const exporter = new WavExporter({ render: async (composition, config) => {
      equal(config.sampleRate, 44100);
      equal(config.seed, 937);
      equal(config.masterVolume, 0.3);
      assert(composition.hardEnd);
      const record = c.getCompositionSnapshot();
      const played = record.admitted.filter(note => note.role !== "ambient");
      equal(composition.notes.length, 1);
      equal(composition.notes[0].startTime, played[0].effectiveStart);
      equal(composition.notes[0].frequency, played[0].frequency);
      equal(composition.notes[0].pan, played[0].pan);
      assert(record.cancelled.length && record.interrupted.length);
      return renderCompositionOffline(composition, config);
    } });
    try {
      await c.startSession();
      await rejects(() => exporter.prepare(c), /Stop the recording/);
      const placed = c.placeStar(0.5, 0.5);
      assert(placed.accepted);
      await waitFor(() => c.getPlaybackPosition() > placed.onset + 0.15, "Clock did not advance");
      c.stop();
      const before = JSON.stringify(c.getCompositionSnapshot());
      const result = await exporter.prepare(c);
      equal(c.getState(), "stopped");
      equal(JSON.stringify(c.getCompositionSnapshot()), before);
      equal(result.frameCount, Math.ceil(c.getOfflineCompositionInput().composition.duration * 44100));
      equal(result.sampleRate, 44100);
      assert(result.filename.includes("solar-harmony"));
      const decoded = await new OfflineAudioContext(2, 1, 44100).decodeAudioData(await result.blob.arrayBuffer());
      equal(decoded.numberOfChannels, 2);
      assert(decoded.getChannelData(0).some(sample => Math.abs(sample) > 0.0001));
      assert(await c.replay());
    } finally { exporter.dispose(); await c.dispose(); }
  });

  await test("Natural completion exports the actual bounded tail with suppressed IDs excluded", async () => {
    const c = controller({ duration: 2, recursion: { maxDepth: 0 }, audio: { reverbDuration: 0.1 } });
    const exporter = new WavExporter({ render: async (composition, config) => {
      const snapshot = c.getCompositionSnapshot();
      equal(snapshot.suppressed.length, 4);
      equal(composition.notes.length, 8);
      assert(!composition.hardEnd);
      assert(composition.notes.every(note => !snapshot.suppressed.some(item => item.id === note.id)));
      const rendered = await renderCompositionOffline(composition, config);
      equal(rendered.length, Math.ceil((2 + 0.7) * 44100));
      return rendered;
    } });
    try {
      await c.startSession();
      for (let i = 0; i < 12; i += 1) assert(c.placeStar(i / 12, 0.55).accepted);
      await waitFor(() => c.getState() === "completed", "Natural completion did not occur");
      const result = await exporter.prepare(c);
      equal(result.frameCount, Math.ceil((2 + 0.7) * 44100));
      equal(result.blob.size, 44 + result.frameCount * 4);
      equal(result.clippedSamples, 0);
    } finally { exporter.dispose(); await c.dispose(); }
  });
}

await test("Valid intentionally silent input renders and encodes without invented content", async () => {
  const data = recording();
  data.input.config.atmosphereEnabled = false;
  const exporter = new WavExporter();
  const result = await exporter.prepare(data);
  const bytes = new Uint8Array(await result.blob.arrayBuffer());
  assert(bytes.subarray(44).every(value => value === 0));
  exporter.dispose();
});

summary.textContent = `${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total).`;
