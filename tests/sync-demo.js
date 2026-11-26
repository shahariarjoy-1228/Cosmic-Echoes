import { CosmicEchoesController } from "../js/controller.js";
import { DEFAULT_CONFIG } from "../js/recursion.js";
import { pointerToNormalized, VISUAL_THEMES } from "../js/visuals.js";

const get = (id) => document.getElementById(id);
const canvas = get("sky");
const controller = new CosmicEchoesController(canvas);
const recursionKeys = Object.keys(DEFAULT_CONFIG);
const message = (text) => { get("message").textContent = text; };

for (const [id, theme] of Object.entries(VISUAL_THEMES)) get("environment").add(new Option(theme.name, id));

function refresh() {
  const d = controller.getDiagnostics();
  const a = d.audio;
  const activeSession = ["playing", "paused", "initializing", "replaying"].includes(d.state);
  get("diagnostics").textContent =
    `${d.state} · ${d.mode} · ${VISUAL_THEMES[d.environment]?.name ?? "Deep Space"} | ` +
    `${d.position.toFixed(2)} s · Remaining ${d.remainingDuration.toFixed(2)} s · Render ${d.visualTime.toFixed(2)} s · ` +
    `Logical gap ${(d.logicalTimelineDifference * 1000).toFixed(1)} ms | Pending ${d.pending} · Active ${d.active} · ` +
    `Free ${d.remaining} · Roots ${d.acceptedRoots} · Recorded ${d.recordedEvents} · Raw notes ${d.rawNotes} | ` +
    `Scheduled melody ${a.retainedMelodic} · Suppressed ${a.suppressedEventCount} · Voices ${a.activeMelodicVoiceCount}/${a.peakMelodicVoiceCount} peak · ` +
    `Pads ${a.ambientVoiceCount} · Atmosphere ${a.atmosphereLayerCount} · Audio ${a.contextState}`;
  if (d.error && get("message").textContent !== d.error) message(d.error);
  get("start").disabled = activeSession;
  get("pause").disabled = !["playing", "replaying"].includes(d.state);
  get("resume").disabled = d.state !== "paused";
  get("stop").disabled = !activeSession;
  get("replay").disabled = activeSession || d.state === "idle" || d.position <= 0;
  get("environment").disabled = activeSession;
}

function place(x, y) {
  controller.setRecursionConfig(Object.fromEntries(recursionKeys.map(key => [key, get(key).valueAsNumber])));
  const result = controller.placeStar(x, y);
  message(result.accepted ? `Placed ${result.eventCount} celestial events at ${result.onset.toFixed(2)} s.` : result.message);
  refresh();
  return result;
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
get("run").addEventListener("click", () => {
  const scenario = get("scenario").value;
  const [depth, branches, roots] = {
    single: [0, 2, 1], binary: [3, 2, 1], ternary: [4, 3, 1],
    multiple: [2, 2, 3], capacity: [4, 3, 3], voices: [1, 3, 5],
  }[scenario];
  for (const key of recursionKeys) get(key).value = DEFAULT_CONFIG[key];
  get("maxDepth").value = depth;
  get("childrenPerStar").value = branches;
  for (let i = 0; i < roots; i += 1) {
    if (!place(roots === 1 ? 0.5 : 0.2 + 0.6 * i / (roots - 1), 0.63).accepted) break;
  }
});

for (const [id, action] of Object.entries({
  start: () => controller.startSession(), pause: () => controller.pause(), resume: () => controller.resume(),
  stop: () => controller.stop(), replay: () => controller.replay(), reset: () => controller.reset(),
})) get(id).addEventListener("click", async () => {
  try {
    const operation = action();
    refresh();
    await operation;
    message(`Session is ${controller.getState()}.`);
  } catch (error) { message(error.message); }
  refresh();
});

for (const [id, update] of Object.entries({
  environment: (input) => controller.setEnvironment(input.value),
  motion: (input) => controller.setReducedMotion(input.value),
  volume: (input) => controller.setMonitoringVolume(input.valueAsNumber),
  particles: (input) => controller.setParticlesEnabled(input.checked),
  ripples: (input) => controller.setRipplesEnabled(input.checked),
  connections: (input) => controller.setConnectionsEnabled(input.checked),
})) get(id).addEventListener(id === "volume" ? "input" : "change", (event) => {
  try { update(event.target); refresh(); } catch (error) { message(error.message); }
});

let timer = setInterval(refresh, 150);
window.addEventListener("pagehide", (event) => {
  clearInterval(timer);
  if (event.persisted) controller.stop();
  else controller.dispose().catch(() => {});
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) timer = setInterval(refresh, 150);
});
refresh();
