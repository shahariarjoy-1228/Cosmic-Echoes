import {
  DEFAULT_CONFIG,
  GLOBAL_EVENT_BUDGET,
  MAX_EVENTS_PER_ROOT,
  canFitTree,
  countEvents,
  generateEchoTree,
  validateConfig,
} from "../js/recursion.js";

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

function close(actual, expected) {
  assert(Math.abs(actual - expected) < 1e-12, `Expected approximately ${expected}, received ${actual}`);
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

for (const [maxDepth, childrenPerStar, expected] of [
  [0, 2, 1], [1, 2, 3], [2, 2, 7], [3, 2, 15], [4, 2, 31], [4, 3, 121], [4, 1, 5],
]) {
  test(`Depth ${maxDepth}, ${childrenPerStar} children produces ${expected} events`, () => {
    equal(countEvents(maxDepth, childrenPerStar), expected);
    equal(generateEchoTree(root, { maxDepth, childrenPerStar }).length, expected);
  });
}

test("Negative depth clamps to zero", () => equal(generateEchoTree(root, { maxDepth: -8 }).length, 1));
test("Excessive depth clamps to four", () => equal(generateEchoTree(root, { maxDepth: 500 }).length, 31));
test("Fractional depth and branching are rounded", () => {
  const config = validateConfig({ maxDepth: 2.6, childrenPerStar: 1.6 });
  equal(config.maxDepth, 3);
  equal(config.childrenPerStar, 2);
});
test("Non-finite settings, amplitude and start time use defaults", () => {
  const config = Object.fromEntries(Object.keys(DEFAULT_CONFIG).map((key, i) => [key, i % 2 ? NaN : Infinity]));
  equal(JSON.stringify(validateConfig(config)), JSON.stringify(DEFAULT_CONFIG));
  const [event] = generateEchoTree({ ...root, amplitude: -Infinity }, config, Infinity);
  equal(event.amplitude, 1);
  equal(event.startTime, 0);
});
test("Missing configuration uses defaults", () => {
  equal(JSON.stringify(validateConfig()), JSON.stringify(DEFAULT_CONFIG));
  equal(generateEchoTree(root).length, 15);
});
test("Finite inputs clamp to valid endpoints", () => {
  const low = validateConfig({ childrenPerStar: -2, decay: 0, spreadAngle: 0, generationDelay: 0, tempo: 0 });
  equal(JSON.stringify(low), JSON.stringify({ maxDepth: 3, childrenPerStar: 1, decay: 0.35, spreadAngle: 30, generationDelay: 0.4, tempo: 40 }));
  const high = validateConfig({ childrenPerStar: 8, decay: 1, spreadAngle: 400, generationDelay: 3, tempo: 90 });
  equal(JSON.stringify(high), JSON.stringify({ maxDepth: 3, childrenPerStar: 3, decay: 0.85, spreadAngle: 180, generationDelay: 2, tempo: 80 }));
  const [event] = generateEchoTree({ ...root, x: -5, y: 8, amplitude: -1 }, null, -2);
  equal(event.x, 0);
  equal(event.y, 1);
  equal(event.amplitude, 0);
  equal(event.startTime, 0);
  equal(generateEchoTree({ ...root, amplitude: 3 })[0].amplitude, 1);
});
test("Invalid required root data is rejected", () => {
  for (const invalidRoot of [{ ...root, id: "" }, { ...root, x: NaN }, { ...root, y: Infinity }, {}]) {
    let error;
    try { generateEchoTree(invalidRoot); } catch (caught) { error = caught; }
    assert(error instanceof TypeError);
  }
});

const tree = generateEchoTree(root, { maxDepth: 4, childrenPerStar: 3 }, 2);
const byId = new Map(tree.map((event) => [event.id, event]));
const children = tree.slice(1);
test("Event IDs are unique", () => equal(byId.size, tree.length));
test("Parents precede their children, in depth-first child order", () => {
  equal(tree[0].parentId, null);
  equal(tree[0].childIndex, null);
  const seen = new Set([tree[0].id]);
  for (const child of children) {
    assert(seen.has(child.parentId));
    equal(child.rootId, root.id);
    seen.add(child.id);
  }
  const paths = generateEchoTree(root, { maxDepth: 2 }).map((event) => JSON.parse(event.id).slice(1));
  equal(JSON.stringify(paths), JSON.stringify([[], [0], [0, 0], [0, 1], [1], [1, 0], [1, 1]]));
});
test("Child depth increments by one", () => {
  for (const child of children) equal(child.depth, byId.get(child.parentId).depth + 1);
});
test("Child radius decays", () => {
  for (const child of children) close(child.radius, byId.get(child.parentId).radius * DEFAULT_CONFIG.decay);
  assert(children.every((child) => child.radius < byId.get(child.parentId).radius));
});
test("Child amplitude decays and silent roots stay silent", () => {
  for (const child of children) close(child.amplitude, byId.get(child.parentId).amplitude * DEFAULT_CONFIG.decay);
  assert(children.every((child) => child.amplitude < byId.get(child.parentId).amplitude));
  assert(generateEchoTree({ ...root, amplitude: 0 }).every((event) => event.amplitude === 0));
});
test("Children start after parents", () => {
  equal(tree[0].startTime, 2);
  for (const child of children) close(child.startTime - byId.get(child.parentId).startTime, 0.8);
});
test("Coordinates remain normalized at a canvas corner", () => {
  const edgeTree = generateEchoTree({ ...root, x: 0, y: 0 }, { maxDepth: 4, childrenPerStar: 3 });
  assert(edgeTree.every(({ x, y }) => x >= 0 && x <= 1 && y >= 0 && y <= 1));
  equal(edgeTree[1].x, 0);
  equal(edgeTree[1].y, 0);
});
test("Spread sets branch angles and single branches travel straight", () => {
  const [parent, left, right] = generateEchoTree(root, { maxDepth: 1, spreadAngle: 180 });
  close(left.angle, parent.angle - Math.PI / 2);
  close(right.angle, parent.angle + Math.PI / 2);
  const [singleParent, child] = generateEchoTree(root, { maxDepth: 1, childrenPerStar: 1 });
  equal(child.angle, singleParent.angle);
  close(child.x, singleParent.x);
  close(child.y, singleParent.y - singleParent.radius);
});
test("Identical inputs produce identical events", () => {
  equal(JSON.stringify(generateEchoTree(root, { maxDepth: 4, childrenPerStar: 3 }, 2)), JSON.stringify(tree));
});
test("Different root IDs produce disjoint event IDs", () => {
  for (const event of generateEchoTree({ ...root, id: 'star",0' })) assert(!byId.has(event.id));
});
test("Input config and root may be frozen", () => {
  const config = Object.freeze({ maxDepth: 10, childrenPerStar: 3 });
  generateEchoTree(Object.freeze({ ...root }), config);
  equal(config.maxDepth, 10);
  equal(config.childrenPerStar, 3);
});
test("Tempo changes the generation delay independently of duration", () => {
  for (const [tempo, expected] of [[40, 1.1], [55, 0.8], [80, 0.55]]) {
    const [parent, child] = generateEchoTree(root, { tempo });
    close(child.startTime - parent.startTime, expected);
    close(child.duration, 1.2 * DEFAULT_CONFIG.decay);
  }
});
test("Capacity accepts an exact fit", () => {
  assert(canFitTree({ maxDepth: 4, childrenPerStar: 3 }, GLOBAL_EVENT_BUDGET - 121));
});
test("Capacity rejects oversized trees and invalid occupancy", () => {
  const config = { maxDepth: 4, childrenPerStar: 3 };
  assert(!canFitTree(config, GLOBAL_EVENT_BUDGET - 120));
  for (const invalid of [undefined, NaN, Infinity, -1, 1.5, 301]) assert(!canFitTree(config, invalid));
});
test("Generator independently respects the per-root cap", () => {
  equal(generateEchoTree(root, { maxDepth: 100, childrenPerStar: 100 }).length, MAX_EVENTS_PER_ROOT);
});
test("All generated numeric fields are finite", () => {
  const fields = ["x", "y", "depth", "radius", "angle", "startTime", "duration", "amplitude"];
  assert(tree.every((event) => fields.every((key) => Number.isFinite(event[key]))));
  assert(children.every((event) => Number.isInteger(event.childIndex)));
});
test("Every duration and radius is positive", () => {
  assert(tree.every(({ duration, radius }) => duration > 0 && radius > 0));
});
test("Start times too large to represent a delay are rejected", () => {
  let error;
  try { generateEchoTree(root, undefined, Number.MAX_VALUE); } catch (caught) { error = caught; }
  assert(error instanceof RangeError);
});

summary.textContent = `${passed} passed, ${failed} failed (${passed + failed} total).`;
