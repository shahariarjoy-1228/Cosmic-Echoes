import { CosmicEchoesController } from "../js/controller.js";
import { getRecursionPreset } from "../js/creative.js";
import { WavExporter } from "../js/export.js";
import { generateAmbientHarmony } from "../js/music.js";
import { countEvents, generateEchoTree } from "../js/recursion.js";

const results = document.getElementById("results");
const evidence = {};
let passed = 0;
let failed = 0;
let skipped = 0;
const assert = (value, message = "Unexpected result") => { if (!value) throw new Error(message); };
const equal = (a, b) => assert(Object.is(a, b), `Expected ${b}, received ${a}`);
const wait = (ms = 25) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message) {
  for (let i = 0; i < 180; i += 1) { if (check()) return; await wait(); }
  throw new Error(message);
}
function result(label, name, error = "") {
  const item = document.createElement("li");
  item.textContent = `${label}: ${name}${error ? " (" + error + ")" : ""}`;
  results.append(item);
}
async function test(name, run) {
  try { await run(); passed += 1; result("PASS", name); }
  catch (error) { failed += 1; result("FAIL", name, error.message); }
}

async function parseWav(output) {
  const bytes = await output.blob.arrayBuffer();
  const v = new DataView(bytes);
  const tag = offset => String.fromCharCode(...new Uint8Array(bytes, offset, 4));
  equal(tag(0), "RIFF"); equal(tag(8), "WAVE"); equal(tag(12), "fmt "); equal(tag(36), "data");
  equal(v.getUint32(4, true), bytes.byteLength - 8);
  equal(v.getUint32(16, true), 16); equal(v.getUint16(20, true), 1); equal(v.getUint16(22, true), 2);
  equal(v.getUint32(24, true), 44100); equal(v.getUint32(28, true), 176400);
  equal(v.getUint16(32, true), 4); equal(v.getUint16(34, true), 16);
  const pcmBytes = v.getUint32(40, true);
  equal(pcmBytes + 44, bytes.byteLength);
  equal(pcmBytes / 4, output.frameCount);
  equal(output.blob.type, "audio/wav");
  equal(output.clippedSamples, 0);
  return { frames: pcmBytes / 4, pcmBytes, wavBytes: bytes.byteLength, seconds: pcmBytes / 176400, clipped: 0 };
}

function makeController(config) {
  const sky = document.createElement("canvas");
  sky.getBoundingClientRect = () => ({ width: 250, height: 160 });
  const c = new CosmicEchoesController(sky, config);
  c.setMonitoringVolume(0);
  return c;
}

await test("Recursion boundaries remain deterministic and parent-complete", () => {
  for (const [maxDepth, childrenPerStar, n] of [[0,1,1],[1,1,2],[2,1,3],[3,2,15],[3,3,40],[4,3,121]]) {
    const config = Object.freeze({ maxDepth, childrenPerStar });
    const root = { id: "qa", x: 0.03, y: 0.97 };
    const first = generateEchoTree(root, config);
    equal(countEvents(maxDepth, childrenPerStar), n);
    equal(first.length, n);
    equal(JSON.stringify(first), JSON.stringify(generateEchoTree(root, config)));
    const ids = new Set(first.map(event => event.id));
    equal(ids.size, n);
    for (const event of first) {
      assert(event.x >= 0 && event.x <= 1 && event.y >= 0 && event.y <= 1 && Number.isFinite(event.startTime));
      if (event.parentId !== null) assert(ids.has(event.parentId));
    }
  }
});

await test("Maximum export uses bounded 64-second stereo PCM output", async () => {
  // This isolated adapter fixture uses the real renderer and ambient mapper.
  const source = {
    getCompositionSnapshot: () => ({ endpoint: 60, sessionId: "qa-max" }),
    getOfflineCompositionInput: () => ({
      composition: { duration: 60, notes: [], ambient: generateAmbientHarmony() },
      config: { reverbDuration: 4 },
    }),
  };
  const exporter = new WavExporter();
  try {
    const parsed = await parseWav(await exporter.prepare(source));
    equal(parsed.frames, 2822400);
    equal(parsed.wavBytes, 11289644);
    evidence.maximumWav = parsed;
  } finally { exporter.dispose(); }
});

if (new URLSearchParams(location.search).get("live") !== "1") {
  skipped += 1;
  result("SKIP", "Real controller and root stress groups require explicit autoplay test policy");
} else {
  await test("Dense placement is atomic across roots and voice budgets", async () => {
    const c = makeController({ recursion: getRecursionPreset("cosmic-cascade"), duration: 8 });
    try {
      assert(await c.startSession());
      assert(c.placeStar(0.25, 0.45).accepted && c.placeStar(0.75, 0.45).accepted);
      const before = JSON.stringify(c.getCompositionSnapshot());
      equal(c.placeStar(0.5, 0.5).reason, "event-capacity");
      equal(JSON.stringify(c.getCompositionSnapshot()), before);
      equal(c.getDiagnostics().occupied, 242);
      await until(() => c.getPlaybackPosition() >= 2, "Audio clock stalled");
      const d = c.getDiagnostics();
      assert(d.occupied < 242 && d.recordedEvents === 242);
      assert(d.audio.peakMelodicVoiceCount > 0 && d.audio.peakMelodicVoiceCount <= 8);
      equal(d.audio.ambientVoiceCount, 2);
      equal(d.audio.atmosphereLayerCount, 1);
      c.stop();
      equal(c.getDiagnostics().audio.scheduledVoiceCount, 0);
      evidence.dense = { recorded: d.recordedEvents, occupiedAfterTwoSeconds: d.occupied,
        peakMelody: d.audio.peakMelodicVoiceCount, pads: d.audio.ambientVoiceCount, atmosphere: d.audio.atmosphereLayerCount };
    } finally { await c.dispose(); }
  });

  await test("Three recording, WAV and replay cycles preserve snapshots and produce valid endpoint policies", async () => {
    const c = makeController({ duration: 2.5, audio: { reverbDuration: 0.1 } });
    const exporter = new WavExporter();
    const gaps = [];
    const wavs = [];
    try {
      for (let cycle = 0; cycle < 3; cycle += 1) {
        assert(await c.startSession());
        // Depth zero permits whole-tree acceptance in this short test session.
        c.setRecursionConfig({ ...getRecursionPreset("quiet-orbit"), maxDepth: 0 });
        const first = c.placeStar(0.25, 0.52);
        assert(first.accepted, first.message);
        c.setRecursionConfig({ ...getRecursionPreset("starlight"), maxDepth: 0 });
        const second = c.placeStar(0.75, 0.48);
        assert(second.accepted, second.message);
        const roots = c.getCompositionSnapshot().placements;
        equal(roots[0].recursion.tempo, 45);
        equal(roots[1].recursion.tempo, 55);
        for (const root of roots) equal(root.notes[0].startTime, root.events[0].startTime);

        if (cycle === 0) {
          await until(() => c.getPlaybackPosition() >= 0.25, "Clock did not reach sample window");
          for (let n = 0; n < 30; n += 1) {
            const d = c.getDiagnostics();
            assert(Number.isFinite(d.logicalTimelineDifference));
            gaps.push(d.logicalTimelineDifference * 1000);
            await wait(20);
          }
        }
        if (cycle < 2) {
          await until(() => c.getPlaybackPosition() >= 0.4, "Clock did not advance");
          c.stop();
        } else {
          await until(() => c.getState() === "completed", "Natural completion did not occur");
        }
        const snapshot = c.getCompositionSnapshot();
        const encodedSnapshot = JSON.stringify(snapshot);
        snapshot.placements[0].recursion.tempo = 70;
        equal(JSON.stringify(c.getCompositionSnapshot()), encodedSnapshot);
        const offline = c.getOfflineCompositionInput();
        equal(offline.composition.hardEnd, cycle < 2);
        assert(offline.composition.notes.every(note => !snapshot.suppressed.some(item => item.id === note.id) &&
          !snapshot.cancelled.some(item => item.id === note.id)));
        const wav = await parseWav(await exporter.prepare(c));
        equal(wav.frames, Math.ceil((snapshot.endpoint + (cycle < 2 ? 0 : 0.7)) * 44100));
        wavs.push({ endpoint: snapshot.endpoint, hardEnd: cycle < 2, ...wav });

        assert(await c.replay());
        await until(() => c.getDiagnostics().active > 0, "Replay did not restore recorded visuals");
        c.stop();
        equal(c.getDiagnostics().audio.scheduledVoiceCount, 0);
        equal(c.getDiagnostics().occupied, 0);
        equal(JSON.stringify(c.getCompositionSnapshot()), encodedSnapshot);
      }
    } finally { exporter.dispose(); await c.dispose(); }
    const ordered = [...gaps].sort((a, b) => a - b);
    evidence.logicalGapMs = { samples: gaps.length, max: ordered.at(-1), median: (ordered[14] + ordered[15]) / 2 };
    evidence.wavs = wavs;
  });

  const frame = document.getElementById("app-frame");
  const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
  frame.src = "../index.html";
  await loaded;
  const doc = () => frame.contentDocument;
  const win = () => frame.contentWindow;
  const get = id => doc().getElementById(id);
  const click = id => get(id).click();
  const set = (id, value, type = "input") => {
    get(id).value = value;
    get(id).dispatchEvent(new (win().Event)(type, { bubbles: true }));
  };
  await test("Root rapid interactions stay bounded and simulated initialization errors recover", async () => {
    const errors = [];
    win().addEventListener("error", error => errors.push(error.message));
    win().addEventListener("unhandledrejection", error => errors.push(String(error.reason)));
    await until(() => get("start") && !get("start").disabled, "Root did not initialize");
    const seen = new Set();
    for (const { id } of doc().querySelectorAll("[id]")) {
      assert(!seen.has(id), `Duplicate ID ${id}`);
      seen.add(id);
    }
    equal(doc().documentElement.lang, "en");
    equal(doc().querySelectorAll("main h1").length, 1);
    set("volume", "0");
    const proto = win().AudioContext.prototype;
    const resume = proto.resume;
    try {
      proto.resume = () => Promise.reject(new Error("Controlled context startup failure"));
      click("start");
      await until(() => get("error").textContent.includes("Controlled context startup failure"), "Startup failure was not reported");
    } finally { proto.resume = resume; }

    for (let i = 0; i < 5; i += 1) click("start");
    await until(() => get("session-state").textContent === "Recording", "Root could not recover");
    set("recursion-preset", "quiet-orbit", "change");
    for (let i = 0; i < 24; i += 1) {
      click("focus-mode");
      click("meditation");
      set("recursion-preset", i % 2 ? "quiet-orbit" : "nebula-bloom", "change");
    }
    assert(!get("meditation").checked && get("focus-mode").getAttribute("aria-pressed") === "false");
    // Intentional touch-style gestures are synthetic browser events, independent of a device.
    const sky = get("sky");
    const rect = sky.getBoundingClientRect();
    const pointer = (kind, x, y) => sky.dispatchEvent(new (win().PointerEvent)(kind, {
      pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, clientX: x, clientY: y,
    }));
    pointer("pointerdown", rect.left + 1, rect.top + 1);
    pointer("pointercancel", rect.left + 1, rect.top + 1);
    pointer("pointerup", rect.left + 1, rect.top + 1);
    assert(get("recording").textContent.includes("0 stars accepted"));
    pointer("pointerdown", rect.left + 1, rect.top + 1);
    pointer("pointerup", rect.left + 1, rect.top + 1);
    assert(get("recording").textContent.includes("3 stars accepted"));
    for (let i = 0; i < 10; i += 1) click("center");
    assert(get("recording").textContent.includes("33 stars accepted"));
    set("motion", "reduced", "change");
    click("pause"); click("pause");
    await until(() => get("session-state").textContent === "Paused", "Pause did not settle");
    const frozen = get("playhead").value;
    await wait(100);
    equal(get("playhead").value, frozen);
    click("resume"); click("resume");
    await until(() => get("session-state").textContent === "Recording" && get("playhead").value > frozen, "Resume did not settle");
    click("stop"); click("stop");
    await until(() => get("session-state").textContent === "Stopped" && !get("prepare").disabled, "Stop did not finalize");
    assert(get("recording").textContent.includes("33 recorded stars"));
    click("reset"); click("reset");
    await until(() => get("session-state").textContent === "Idle", "Reset did not settle");
    assert(get("prepare").disabled && get("replay").disabled);
    equal(errors.length, 0);
    evidence.rootStress = { starts: 5, focusToggles: 24, meditationToggles: 24, presetSelections: 24,
      centrePlacements: 10, cancelledTouchGestures: 1, acceptedTouchGestures: 1, pause: 2, resume: 2, stop: 2, reset: 2 };
  });
  frame.remove();
}

document.getElementById("evidence").textContent = JSON.stringify(evidence);
document.getElementById("summary").textContent = `${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total).`;
