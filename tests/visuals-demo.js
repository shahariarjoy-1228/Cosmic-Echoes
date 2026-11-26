import { DEFAULT_CONFIG, canFitTree, countEvents, generateEchoTree, validateConfig } from "../js/recursion.js";
import { VisualEngine, VISUAL_THEMES, pointerToNormalized } from "../js/visuals.js";

const get = (id) => document.getElementById(id);
const canvas = get("sky");
const engine = new VisualEngine(canvas);
let nextRoot = 1;
let position = 0;
let anchor = 0;
let running = false;
let rejected = 0;

for (const [id, theme] of Object.entries(VISUAL_THEMES)) get("theme").add(new Option(theme.name, id));
for (const [key, value] of Object.entries(DEFAULT_CONFIG)) get(key).value = value;

const time = () => running ? Math.max(0, (performance.now() - anchor) / 1000) : position;
const feedback = (message) => { get("feedback").textContent = message; };

function refresh() {
  const stats = engine.getDiagnostics();
  get("stats").textContent = [
    `Timeline: ${stats.state} at ${stats.position.toFixed(2)} s`,
    `Pending: ${stats.pending} · Active: ${stats.active} · Occupied: ${stats.occupied} · Remaining: ${stats.remaining}`,
    `Active roots: ${stats.activeRoots} · Retained roots: ${stats.storedRoots} · Rejected: ${rejected}`,
    `${Math.round(stats.width)} × ${Math.round(stats.height)} CSS px · DPR ${stats.dpr.toFixed(2)} · ${stats.fps ? stats.fps.toFixed(0) + " FPS (approx.)" : "FPS unavailable"}`,
    `${VISUAL_THEMES[stats.theme].name} · ${stats.motion} motion (${stats.reducedMotion ? "reduced" : "full"})`,
  ].join(" | ");
  if (stats.error) feedback(stats.error);
  get("start").disabled = running || stats.state === "paused";
  get("pause").disabled = !running;
  get("resume").disabled = stats.state !== "paused";
}

function readConfig() {
  return validateConfig(Object.fromEntries(Object.keys(DEFAULT_CONFIG).map((key) => [key, get(key).valueAsNumber])));
}

function buildTree(x, y, config, start, occupied) {
  if (!canFitTree(config, occupied)) throw new RangeError("The whole tree does not fit. Try a smaller tree or wait for events to expire.");
  const id = `demo-${nextRoot++}`;
  return generateEchoTree({ id, x, y }, config, start);
}

function place(x, y) {
  try {
    const config = readConfig();
    const now = time();
    engine.renderAt(now);
    const events = buildTree(x, y, config, now, engine.getDiagnostics().occupied);
    engine.addEvents(events);
    feedback(`Placed a star with ${countEvents(config.maxDepth, config.childrenPerStar)} events.${running ? "" : " Start or resume to see it fade in."}`);
  } catch (error) {
    rejected += 1;
    feedback(error.message);
  }
  refresh();
}

canvas.addEventListener("pointerup", (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  const point = pointerToNormalized(canvas, event.clientX, event.clientY);
  if (point) place(point.x, point.y);
});
get("placement").addEventListener("submit", (event) => {
  event.preventDefault();
  place(get("x").valueAsNumber, get("y").valueAsNumber);
});
get("center").addEventListener("click", () => place(0.5, 0.5));

function reset() {
  running = false;
  position = 0;
  rejected = 0;
  engine.reset();
}

get("start").addEventListener("click", () => {
  anchor = performance.now() - position * 1000;
  running = true;
  engine.start(time);
  refresh();
});
get("pause").addEventListener("click", () => {
  position = time();
  running = false;
  engine.pause();
  engine.renderAt(position);
  refresh();
});
get("resume").addEventListener("click", () => {
  anchor = performance.now() - position * 1000;
  running = true;
  engine.resume();
  refresh();
});
get("reset").addEventListener("click", () => { reset(); feedback("Timeline reset and events cleared."); refresh(); });
get("clear").addEventListener("click", () => { engine.clear(); feedback("Universe cleared."); refresh(); });

get("load").addEventListener("click", () => {
  try {
    reset();
    const scenario = get("scenario").value;
    const specs = {
      single: [[0, 2]],
      binary: [[3, 2]],
      ternary: [[4, 3]],
      multiple: [[3, 2], [3, 2], [3, 2]],
      stress: [[4, 3], [4, 3], [4, 2], [3, 2], [2, 2], [1, 2], [0, 2], [0, 2]],
      reduced: [[3, 2]],
    }[scenario];
    if (scenario === "reduced") {
      get("motion").value = "reduced";
      engine.setReducedMotion("reduced");
    }
    const events = [];
    specs.forEach(([maxDepth, childrenPerStar], index) => {
      const x = specs.length === 1 ? 0.5 : 0.15 + (index % 4) * 0.23;
      const y = specs.length === 1 ? 0.58 : 0.4 + Math.floor(index / 4) * 0.36;
      events.push(...buildTree(x, y, { ...DEFAULT_CONFIG, maxDepth, childrenPerStar }, index * 0.12, events.length));
    });
    engine.addEvents(events);
    feedback(`Loaded ${events.length} events. Press Start to advance the timeline.`);
  } catch (error) {
    feedback(error.message);
  }
  refresh();
});

for (const [id, update] of Object.entries({
  theme: (input) => engine.setTheme(input.value),
  motion: (input) => engine.setReducedMotion(input.value),
  quality: (input) => engine.setQuality(input.value),
  particles: (input) => engine.setParticlesEnabled(input.checked),
  ripples: (input) => engine.setRipplesEnabled(input.checked),
  connections: (input) => engine.setConnectionsEnabled(input.checked),
})) get(id).addEventListener("change", (event) => { update(event.target); refresh(); });

let timer = setInterval(refresh, 250);
window.addEventListener("pagehide", (event) => {
  clearInterval(timer);
  if (event.persisted) {
    if (running) get("pause").click();
  } else engine.dispose();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) timer = setInterval(refresh, 250);
});
refresh();
