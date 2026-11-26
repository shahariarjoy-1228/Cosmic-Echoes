import { createMeditationScheduler, getRecursionPreset, identifyMatchingPreset, MEDITATION_INTERVAL, RECURSION_PRESETS } from "../js/creative.js";
import { countEvents, generateEchoTree, validateConfig } from "../js/recursion.js";

const results = document.getElementById("results");
const summary = document.getElementById("summary");
const frame = document.getElementById("app-frame");
let passed = 0;
let failed = 0;
let skipped = 0;

const assert = (value, message = "Unexpected result") => { if (!value) throw new Error(message); };
const equal = (actual, expected) => assert(Object.is(actual, expected), `Expected ${expected}, received ${actual}`);
const wait = (ms = 30) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message, attempts = 240) {
  for (let i = 0; i < attempts; i += 1) {
    if (check()) return;
    await wait();
  }
  throw new Error(message);
}

async function test(name, run) {
  const item = document.createElement("li");
  try { await run(); passed += 1; item.textContent = `PASS: ${name}`; }
  catch (error) { failed += 1; item.textContent = `FAIL: ${name} (${error.message})`; }
  results.append(item);
}

function skip(name) {
  skipped += 1;
  const item = document.createElement("li");
  item.textContent = `SKIP: ${name}`;
  results.append(item);
}

await test("Four immutable validated presets generate the required tree sizes", () => {
  const counts = { "quiet-orbit": 3, starlight: 15, "nebula-bloom": 40, "cosmic-cascade": 121 };
  equal(Object.keys(RECURSION_PRESETS).length, 4);
  assert(Object.isFrozen(RECURSION_PRESETS));
  for (const [id, expected] of Object.entries(counts)) {
    const config = getRecursionPreset(id);
    assert(Object.isFrozen(RECURSION_PRESETS[id]) && Object.isFrozen(RECURSION_PRESETS[id].config));
    equal(JSON.stringify(validateConfig(config)), JSON.stringify(config));
    equal(countEvents(config.maxDepth, config.childrenPerStar), expected);
    equal(generateEchoTree({ id, x: 0.5, y: 0.5 }, config).length, expected);
    equal(identifyMatchingPreset(config), id);
    config.tempo = 41;
    equal(identifyMatchingPreset(config), "custom");
    equal(identifyMatchingPreset(getRecursionPreset(id)), id);
  }
});

await test("Meditation follows composition time, pauses and skips overdue catch-up", () => {
  const scheduler = createMeditationScheduler();
  const calls = [];
  const place = (x, y) => { calls.push([x, y]); return { accepted: true }; };
  equal(scheduler.enabled, false);
  scheduler.tick("playing", 20, place);
  scheduler.enable(2);
  scheduler.enable(4);
  equal(MEDITATION_INTERVAL, 5);
  scheduler.tick("playing", 6.99, place);
  scheduler.tick("paused", 9, place);
  equal(calls.length, 0);
  scheduler.tick("playing", 7, place);
  scheduler.tick("playing", 7, place);
  equal(calls.length, 1);
  scheduler.tick("playing", 40, place);
  scheduler.tick("playing", 40, place);
  scheduler.tick("playing", 44.99, place);
  equal(calls.length, 2);
  scheduler.tick("playing", 45, place);
  equal(calls.length, 3);
  assert(calls.flat().every(value => value >= 0.15 && value <= 0.85));
  assert(JSON.stringify(calls[0]) !== JSON.stringify(calls[1]));
});

await test("Temporary capacity waits for the next interval; terminal failures disable", () => {
  const scheduler = createMeditationScheduler();
  let calls = 0;
  const reject = reason => () => { calls += 1; return { accepted: false, reason }; };
  scheduler.enable(0);
  equal(scheduler.tick("playing", 5, reject("event-capacity")).reason, "event-capacity");
  assert(scheduler.enabled);
  scheduler.tick("playing", 5.1, reject("event-capacity"));
  equal(calls, 1);
  equal(scheduler.tick("playing", 10, reject("recording-capacity")).reason, "recording-capacity");
  assert(!scheduler.enabled);
  for (const reason of ["session-duration", "invalid-state", "audio-unavailable"]) {
    scheduler.enable(0);
    scheduler.tick("playing", 5, reject(reason));
    assert(!scheduler.enabled);
  }
  scheduler.enable(0);
  const failure = scheduler.tick("playing", 5, () => { throw new Error("Controlled placement failure"); });
  equal(failure.message, "Controlled placement failure");
  assert(!scheduler.enabled);
});

await test("Stop, replay, completion and explicit shutdown invalidate pending work", () => {
  const scheduler = createMeditationScheduler();
  const forbidden = () => { throw new Error("Unexpected placement"); };
  for (const state of ["idle", "stopped", "completed", "replaying", "disposed", "initializing"]) {
    scheduler.enable(0);
    equal(scheduler.tick(state, 20, forbidden), null);
    assert(!scheduler.enabled);
    equal(scheduler.tick("playing", 30, forbidden), null);
  }
  scheduler.enable(0);
  scheduler.disable();
  scheduler.disable();
  equal(scheduler.tick("playing", 40, forbidden), null);
});

const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
frame.src = "../index.html";
await loaded;
const doc = () => frame.contentDocument;
const win = () => frame.contentWindow;
const get = id => doc().getElementById(id);
const click = id => get(id).click();
const change = (id, value, type = "input") => {
  get(id).value = value;
  get(id).dispatchEvent(new (win().Event)(type, { bubbles: true }));
};
const state = () => get("session-state").textContent;

await test("Root defaults are silent and presets update future settings independently", async () => {
  await until(() => get("start") && !get("start").disabled, "Root failed to initialize");
  get("diagnostics-panel").open = true;
  await until(() => get("diagnostics").textContent.includes("uninitialized"), "Premature audio initialization");
  equal(state(), "Idle");
  assert(get("meditation").disabled && !get("meditation").checked && get("meditation").labels.length);
  equal(get("focus-mode").getAttribute("aria-pressed"), "false");
  assert(get("recursion-preset").labels.length);
  change("environment", "solar-harmony", "change");
  for (const [id, expected] of [["quiet-orbit",3], ["starlight",15], ["nebula-bloom",40], ["cosmic-cascade",121]]) {
    change("recursion-preset", id, "change");
    const config = getRecursionPreset(id);
    for (const [key, value] of Object.entries(config)) equal(get(key).valueAsNumber, value);
    assert(get("recursion-preview").textContent.includes(`${expected} stars`));
    equal(get("environment").value, "solar-harmony");
  }
  change("tempo", "61");
  equal(get("recursion-preset").value, "custom");
  change("environment", "deep-space", "change");
  change("recursion-preset", "quiet-orbit", "change");
});

await test("Focus hides secondary controls, retains essentials and restores focus at narrow widths", async () => {
  for (const width of [320, 390, 768, 1440]) {
    frame.style.width = `${width}px`;
    await until(() => win().innerWidth === width, "Viewport width did not apply");
    click("focus-mode");
    equal(get("focus-mode").getAttribute("aria-pressed"), "true");
    equal(get("focus-mode").textContent, "Exit focus mode");
    equal(win().getComputedStyle(doc().querySelector("aside")).display, "none");
    get("environment").focus();
    equal(doc().activeElement, get("focus-mode"));
    for (const id of ["start", "stop", "center", "playhead", "meditation", "volume", "recording"]) {
      assert(get(id).getBoundingClientRect().width > 0, `Hidden essential control ${id}`);
    }
    const bounds = get("sky").getBoundingClientRect();
    assert(bounds.width > 200 && bounds.height > 200);
    assert(doc().documentElement.scrollWidth <= doc().documentElement.clientWidth + 1, `Overflow at ${width}`);
    get("focus-mode").dispatchEvent(new (win().KeyboardEvent)("keydown", { key: "Escape", bubbles: true }));
    equal(get("focus-mode").getAttribute("aria-pressed"), "false");
    equal(doc().activeElement, get("focus-mode"));
    assert(win().getComputedStyle(doc().querySelector("aside")).display !== "none");
  }
  frame.style.width = "100%";
});

if (new URLSearchParams(location.search).get("live") !== "1") {
  skip("Live creative workflow requires the headless autoplay override or equivalent policy");
} else {
  await test("Real root workflow records automatic and manual trees, changes focus, exports and replays", async () => {
    change("volume", "0");
    change("recursion-preset", "quiet-orbit", "change");
    click("start");
    await until(() => state() === "Recording" && !get("meditation").disabled, "Unable to start session");
    click("meditation");
    assert(get("meditation").checked);
    await until(() => get("recording").textContent.includes("3 stars accepted"), "No real automatic root", 360);
    assert(!get("notice").textContent.includes("Star placed"), "Routine auto placement announced");
    click("center");
    assert(get("recording").textContent.includes("6 stars accepted"));
    click("pause");
    await until(() => state() === "Paused", "Pause failed");
    const time = get("playhead").value;
    assert(get("meditation").checked && get("meditation-status").textContent.includes("paused"));
    await wait(300);
    equal(get("playhead").value, time);
    assert(get("recording").textContent.includes("6 stars accepted"));
    click("resume");
    await until(() => state() === "Recording", "Resume failed");
    click("focus-mode");
    assert(!get("stop").disabled && !get("meditation").disabled);
    assert(get("recording").textContent.includes("6 stars accepted"));
    click("focus-mode");
    change("recursion-preset", "starlight", "change");
    click("center");
    assert(get("recording").textContent.includes("21 stars accepted"), "Preset altered prior trees");
    click("stop");
    await until(() => !get("prepare").disabled, "Recording did not finalize");
    assert(!get("meditation").checked && get("meditation").disabled);
    const recording = get("recording").textContent;
    assert(recording.includes("21 recorded stars"));
    click("prepare");
    await until(() => !get("download").disabled, "WAV did not prepare");
    const browser = win();
    const create = browser.URL.createObjectURL;
    const anchorClick = browser.HTMLAnchorElement.prototype.click;
    let blob;
    try {
      browser.URL.createObjectURL = value => { blob = value; return create.call(browser.URL, value); };
      browser.HTMLAnchorElement.prototype.click = () => {};
      click("download");
      assert(blob?.type === "audio/wav");
      const h = new DataView(await blob.arrayBuffer());
      assert(h.getUint32(0) === 0x52494646);
      equal(h.getUint16(22, true), 2);
      equal(h.getUint32(24, true), 44100);
      equal(h.getUint16(34, true), 16);
      equal(h.getUint32(40, true) + 44, blob.size);
    } finally {
      browser.URL.createObjectURL = create;
      browser.HTMLAnchorElement.prototype.click = anchorClick;
    }
    const metadata = get("wav-metadata").textContent;
    click("focus-mode");
    click("focus-mode");
    equal(get("wav-metadata").textContent, metadata);
    click("replay");
    await until(() => state() === "Replaying", "Replay did not start");
    assert(get("meditation").disabled && !get("meditation").checked);
    click("stop");
    await until(() => state() === "Stopped", "Replay did not stop");
    equal(get("recording").textContent, recording);
    equal(get("wav-metadata").textContent, metadata);
    click("reset");
    await until(() => state() === "Idle", "Reset failed");
    assert(get("meditation").disabled && !get("meditation").checked);
  });
}

summary.textContent = `${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total).`;
