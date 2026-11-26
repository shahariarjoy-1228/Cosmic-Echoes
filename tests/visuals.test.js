import { GLOBAL_EVENT_BUDGET, generateEchoTree } from "../js/recursion.js";
import { mapCelestialEventsToMusic } from "../js/music.js";

const results = document.querySelector("#results");
const summary = document.querySelector("#summary");
let passed = 0;
let failed = 0;

function assert(condition, message = "Unexpected result") {
  if (!condition) throw new Error(message);
}

function same(actual, expected) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}

function throws(run, type) {
  let error;
  try { run(); } catch (caught) { error = caught; }
  assert(error instanceof type, `Expected ${type.name}, received ${error}`);
}

function test(name, run) {
  const item = document.createElement("li");
  try { run(); passed += 1; item.textContent = `PASS: ${name}`; }
  catch (error) { failed += 1; item.textContent = `FAIL: ${name} (${error.message})`; }
  results.append(item);
}

const oldRaf = window.requestAnimationFrame;
let importFrames = 0;
window.requestAnimationFrame = () => { importFrames += 1; };
const originalCanvasCount = document.querySelectorAll("canvas").length;
let visuals;
try { visuals = await import("../js/visuals.js"); }
finally { window.requestAnimationFrame = oldRaf; }
const {
  DEFAULT_VISUAL_CONFIG, VISUAL_THEMES, VisualEngine, validateVisualConfig,
  normalizedToCanvas, canvasToNormalized, pointerToNormalized, getEventVisualState, getVisualMetrics,
} = visuals;

const tree = (id = "star", maxDepth = 3, childrenPerStar = 2, time = 0, tempo = 55) =>
  generateEchoTree({ id, x: 0.5, y: 0.65 }, { maxDepth, childrenPerStar, tempo }, time);
const busyTree = tree("dense", 4, 3);

function makeFixture(config) {
  const canvas = document.createElement("canvas");
  const bounds = { left: 100, top: 70, width: 240, height: 180 };
  canvas.getBoundingClientRect = () => bounds;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const engine = new VisualEngine(canvas, { particles: false, ...config });
  return { canvas, bounds, ctx, engine };
}

function scene(config, run) {
  const fixture = makeFixture(config);
  try { run(fixture); }
  finally { fixture.engine.dispose(); }
}

function counts(engine, pending, active) {
  const stats = engine.getDiagnostics();
  same([stats.pending, stats.active, stats.occupied], [pending, active, pending + active]);
}

function pixel(ctx, canvas, x, y) {
  return [...ctx.getImageData(Math.floor(x * canvas.width), Math.floor(y * canvas.height), 1, 1).data];
}

test("Import is inert and defaults are immutable", () => {
  same(importFrames, 0);
  same(document.querySelectorAll("canvas").length, originalCanvasCount);
  same(validateVisualConfig(), DEFAULT_VISUAL_CONFIG);
  assert(Object.isFrozen(DEFAULT_VISUAL_CONFIG) && Object.isFrozen(VISUAL_THEMES));
  for (const theme of Object.values(VISUAL_THEMES)) assert(Object.isFrozen(theme));
});

test("Configuration bounds, invalid values, and ownership", () => {
  const config = Object.freeze({ particleCount: 900, maxDpr: 9, seed: Infinity });
  const validated = validateVisualConfig(config);
  same([validated.particleCount, validated.maxDpr, validated.seed], [200, 2, 1729]);
  same(validateVisualConfig({ maxDpr: NaN, particleCount: Infinity }), DEFAULT_VISUAL_CONFIG);
  same(validateVisualConfig({ particleCount: -1, maxDpr: 0.3 }).particleCount, 0);
  same(config.particleCount, 900);
  for (const theme of ["constructor", "unknown"]) throws(() => validateVisualConfig({ theme }), RangeError);
  throws(() => new VisualEngine({}), TypeError);
  const canvas = document.createElement("canvas");
  canvas.getContext = () => null;
  throws(() => new VisualEngine(canvas), Error);
});

test("Normalized and logical coordinates round trip and clamp", () => {
  same(normalizedToCanvas(0, 0, 480, 160), { x: 0, y: 0 });
  same(normalizedToCanvas(0.5, 0.5, 480, 160), { x: 240, y: 80 });
  same(normalizedToCanvas(1, 1, 480, 160), { x: 480, y: 160 });
  same(canvasToNormalized(240, 80, 480, 160), { x: 0.5, y: 0.5 });
  same(canvasToNormalized(-20, 800, 480, 160), { x: 0, y: 1 });
  same(canvasToNormalized(0, 0, 0, 160), null);
  throws(() => normalizedToCanvas(Infinity, 1, 1, 1), RangeError);
});

test("Pointer uses bounds and ignores backing-store pixel density", () => {
  scene({}, ({ canvas }) => {
    same(pointerToNormalized(canvas, 220, 160), { x: 0.5, y: 0.5 });
    canvas.width = 720;
    same(pointerToNormalized(canvas, 220, 160), { x: 0.5, y: 0.5 });
    same(pointerToNormalized(canvas, -20, 800), { x: 0, y: 1 });
  });
});

test("High-DPI sizing and resize reset transform and preserve geometry", () => {
  const descriptor = Object.getOwnPropertyDescriptor(window, "devicePixelRatio");
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 3 });
  try {
    scene({}, ({ canvas, bounds, ctx, engine }) => {
      same([canvas.width, canvas.height, engine.getDiagnostics().dpr], [480, 360, 2]);
      const [root] = tree("center", 0);
      engine.addEvents([{ ...root, y: 0.5 }]);
      engine.renderAt(0.4);
      const before = pixel(ctx, canvas, 0.5, 0.5);
      bounds.width = 160;
      bounds.height = 240;
      engine.resize();
      engine.resize();
      same([canvas.width, canvas.height, ctx.getTransform().a, ctx.getTransform().d], [320, 480, 2, 2]);
      const after = pixel(ctx, canvas, 0.5, 0.5);
      assert(after.every((channel, index) => Math.abs(channel - before[index]) <= 3));
      bounds.width = bounds.height = 0;
      engine.resize();
      same([canvas.width, canvas.height], [1, 1]);
      same(pointerToNormalized(canvas, 100, 70), null);
      bounds.width = bounds.height = 6000;
      engine.resize();
      assert(canvas.width * canvas.height <= 8_000_000);
    });
  } finally {
    if (descriptor) Object.defineProperty(window, "devicePixelRatio", descriptor);
    else delete window.devicePixelRatio;
  }
});

test("Actual single, binary and maximum trees fit", () => {
  scene({}, ({ engine }) => {
    same(engine.addEvents(tree("one", 0)), 1);
    same(engine.addEvents(tree("binary")), 15);
    same(engine.addEvents(busyTree), 121);
    counts(engine, 134, 3);
    same(engine.getDiagnostics().activeRoots, 3);
  });
});

test("Validation is atomic for malformed trees and duplicate IDs", () => {
  scene({}, ({ engine }) => {
    const [root, child] = tree("one", 1, 1);
    for (const fields of [{ x: -0.1 }, { y: Infinity }, { duration: 0 }, { radius: 0 }, { angle: NaN },
      { startTime: -1 }, { startTime: Infinity }, { depth: 5 }, { amplitude: 2 }]) {
      throws(() => engine.addEvents([{ ...root, ...fields }]), RangeError);
    }
    for (const batch of [[{ ...root, id: "" }], [child], [root, root],
      [root, { ...child, rootId: "other" }], [root, { ...child, depth: 3 }],
      [root, child, { ...child, id: "duplicate-slot" }]]) {
      throws(() => engine.addEvents(batch), TypeError);
    }
    counts(engine, 0, 0);
    throws(() => engine.addEvents(Array(301).fill(root)), RangeError);
    engine.addEvents([root, child]);
    throws(() => engine.addEvents([root]), TypeError);
    counts(engine, 1, 1);
  });
});

test("Identifiers align with the mapper and caller events are never mutated", () => {
  scene({}, ({ engine }) => {
    const events = Object.freeze(tree().map(Object.freeze));
    const before = JSON.stringify(events);
    const notes = mapCelestialEventsToMusic(events);
    assert(notes.every(note => events.some(event => event.id === note.celestialEventId)));
    engine.addEvents(events);
    engine.renderAt(0.5);
    same(JSON.stringify(events), before);
    counts(engine, 14, 1);
  });
});

test("Half-open lifetimes preserve seconds and bound progress", () => {
  const [root, child] = tree("tempo", 1, 1, 2, 80);
  same(getEventVisualState(root, 1).status, "pending");
  same(getEventVisualState(root, 2), { status: "active", age: 0, progress: 0 });
  same(getEventVisualState(root, 3.2).status, "expired");
  same(getEventVisualState(root, 10).progress, 1);
  same(getEventVisualState(root, 0).progress, 0);
  const state = getEventVisualState(root, 2.6);
  assert(Math.abs(state.age - 0.6) < 1e-10 && Math.abs(state.progress - 0.5) < 1e-10);
  assert(Math.abs(child.startTime - 2.55) < 1e-10);
  same(getEventVisualState(child, 2.54).status, "pending");
  same(getEventVisualState(child, 2.55).status, "active");
  throws(() => getEventVisualState(child, -1), RangeError);
});

test("External rendering is repeatable and backward evaluation keeps only retained events", () => {
  scene({}, ({ engine }) => {
    engine.addEvents(tree("clock", 1, 1, 2));
    engine.renderAt(2.9);
    counts(engine, 0, 2);
    const metrics = engine.getDiagnostics();
    engine.renderAt(2.9);
    same(engine.getDiagnostics(), metrics);
    engine.renderAt(2.1);
    counts(engine, 1, 1);
    engine.renderAt(6);
    counts(engine, 0, 0);
    engine.renderAt(2.9);
    counts(engine, 0, 0);
  });
});

test("Pixels show active stars only, with deterministic frozen rendering", () => {
  scene({ glow: true, ripples: false }, ({ engine, ctx, canvas }) => {
    const [root] = tree("pixel", 0, 2, 1);
    const sample = () => pixel(ctx, canvas, root.x, root.y);
    const baseline = sample();
    engine.addEvents([root]);
    engine.renderAt(0.9);
    same(sample(), baseline);
    engine.renderAt(1.4);
    const first = sample();
    assert(JSON.stringify(first) !== JSON.stringify(baseline));
    engine.renderAt(1.4);
    same(sample(), first);
    engine.renderAt(2.2);
    same(sample(), baseline);
  });
});

test("Star and ripple sizes preserve decay and use the shorter canvas side", () => {
  const [root, child] = tree("metrics", 1, 1);
  const metrics = getVisualMetrics(root, 0.4, Math.min(600, 200));
  const smaller = getVisualMetrics(child, 0.4, Math.min(200, 600));
  assert(smaller.radius < metrics.radius && smaller.opacity < metrics.opacity);
  same(getVisualMetrics(root, 0.4, Math.min(200, 600)), metrics);
  const late = getVisualMetrics(root, 0.8, 200);
  assert(late.rippleRadius > metrics.rippleRadius && late.rippleOpacity < metrics.rippleOpacity);
  same(getVisualMetrics(root, 0.4, 200, true).rippleOpacity, 0);
  same(getVisualMetrics(root, 1, 200).opacity, 0);
});

test("Connections use parent geometry only and clean expired metadata", () => {
  scene({ ripples: false }, ({ engine, ctx }) => {
    const lines = [];
    const moveTo = ctx.moveTo.bind(ctx);
    const lineTo = ctx.lineTo.bind(ctx);
    let start;
    ctx.moveTo = (x, y) => { start = [x, y]; moveTo(x, y); };
    ctx.lineTo = (x, y) => { lines.push([start, [x, y]]); lineTo(x, y); };
    const [root, child] = tree("link", 1, 1);
    const delayed = { ...child, startTime: 1.3 };
    engine.addEvents([root, delayed, ...tree("other", 0)]);
    engine.renderAt(1.25);
    same(lines, []);
    same(engine.getDiagnostics().parentRecords, 1);
    engine.renderAt(1.45);
    same(lines, [[[root.x * 240, root.y * 180], [child.x * 240, child.y * 180]]]);
    lines.length = 0;
    engine.setConnectionsEnabled(false);
    same(lines, []);
    engine.renderAt(3);
    same([engine.getDiagnostics().parentRecords, engine.getDiagnostics().storedRoots], [0, 0]);
  });
});

test("Exact capacity, atomic rejection, and cleanup permit repeated placement", () => {
  scene({}, ({ engine }) => {
    for (let cycle = 0; cycle < 4; cycle += 1) {
      const batch = Array.from({ length: GLOBAL_EVENT_BUDGET }, (_, id) => tree(`star-${cycle}-${id}`, 0, 2, cycle * 2 + 0.1)[0]);
      same(engine.addEvents(batch), 300);
      counts(engine, 300, 0);
      throws(() => engine.addEvents(tree(`extra-${cycle}`, 0, 2, cycle * 2 + 0.1)), RangeError);
      counts(engine, 300, 0);
      engine.renderAt(cycle * 2 + 0.4);
      counts(engine, 0, 300);
      engine.renderAt((cycle + 1) * 2);
      counts(engine, 0, 0);
      same([engine.getDiagnostics().storedRoots, engine.getDiagnostics().parentRecords], [0, 0]);
    }
  });
});

test("Controlled animation, observers and motion preferences clean up", () => {
  const originals = [window.requestAnimationFrame, window.cancelAnimationFrame, window.ResizeObserver, window.matchMedia];
  const frames = new Map();
  let next = 0;
  let removed = false;
  let disconnected = false;
  let changed;
  const media = {
    matches: true,
    addEventListener(name, callback) { changed = callback; },
    removeEventListener(name, callback) { removed = callback === changed; },
  };
  window.requestAnimationFrame = (callback) => { frames.set(++next, callback); return next; };
  window.cancelAnimationFrame = (id) => frames.delete(id);
  window.ResizeObserver = class { observe() {} disconnect() { disconnected = true; } };
  window.matchMedia = () => media;
  try {
    scene({ particles: true, particleCount: 500 }, ({ engine }) => {
      same(engine.getDiagnostics().particleCount, 200);
      assert(engine.getDiagnostics().reducedMotion);
      engine.setReducedMotion("full");
      assert(!engine.getDiagnostics().reducedMotion);
      engine.setReducedMotion("auto");
      engine.addEvents(tree("animate", 1, 1));
      media.matches = false;
      changed();
      assert(!engine.getDiagnostics().reducedMotion);
      let time = 0.3;
      engine.start(() => time);
      engine.start(() => 10);
      engine.setTheme("solar-harmony");
      same(frames.size, 1);
      const [id, frame] = frames.entries().next().value;
      frames.delete(id);
      frame(100);
      counts(engine, 1, 1);
      same(engine.getDiagnostics().position, 0.3);
      engine.pause();
      same(frames.size, 0);
      time = 0.9;
      same(engine.getDiagnostics().position, 0.3);
      engine.resume();
      same(frames.size, 1);
      const [resumeId, resumeFrame] = frames.entries().next().value;
      frames.delete(resumeId);
      resumeFrame(200);
      counts(engine, 0, 2);
      engine.stop();
      same(frames.size, 0);
      engine.start(() => time);
      engine.clear();
      counts(engine, 0, 0);
      engine.dispose();
      engine.dispose();
      assert(removed && disconnected);
      same(frames.size, 0);
      throws(() => engine.start(() => time), Error);
      throws(() => engine.renderAt(0), Error);
      assert(Number.isFinite(engine.getDiagnostics().fps));
    });
  } finally {
    [window.requestAnimationFrame, window.cancelAnimationFrame, window.ResizeObserver, window.matchMedia] = originals;
  }
});

summary.textContent = `${passed} passed, ${failed} failed (${passed + failed} total).`;
