import { CosmicEchoesController } from "../js/controller.js";
import { WavExporter } from "../js/export.js";
import { DEFAULT_CONFIG } from "../js/recursion.js";
import { pointerToNormalized, VISUAL_THEMES } from "../js/visuals.js";

const get = (id) => document.getElementById(id);
const canvas = get("sky");
const exporter = new WavExporter();
let controller = null;
let changing = false;
const message = (value) => { get("session-message").textContent = value; };
const exportError = (value) => { get("export-error").textContent = value; };
for (const [id, theme] of Object.entries(VISUAL_THEMES)) get("environment").add(new Option(theme.name, id));

function refresh() {
  const d = controller?.getDiagnostics();
  const state = d?.state ?? "idle";
  const active = ["initializing", "playing", "paused", "replaying"].includes(state);
  const snapshot = active ? null : controller?.getCompositionSnapshot();
  const ready = Boolean(snapshot?.endpoint > 0);
  const admitted = snapshot?.admitted.filter(note => note.role !== "ambient").length ?? d?.audio.retainedMelodic ?? 0;
  const suppressed = snapshot?.suppressed.length ?? d?.audio.suppressedEventCount ?? 0;
  const status = exporter.getStatus();
  const result = exporter.getResult();

  get("recording").textContent = [
    `Session: ${state} · Audio: ${d?.audio.contextState ?? "uninitialized"}`,
    `Finalized recording: ${ready ? "yes" : "no"} · Duration: ${(snapshot?.endpoint ?? d?.position ?? 0).toFixed(2)} s`,
    `Celestial events: ${d?.recordedEvents ?? 0} · Admitted melody: ${admitted} · Suppressed: ${suppressed}`,
  ].join(" | ");
  const statusText = `${status.state}: ${status.message}`;
  if (get("export-status").textContent !== statusText) get("export-status").textContent = statusText;
  get("metadata").textContent = result
    ? `${result.filename} · ${result.byteLength.toLocaleString()} bytes · ${result.sampleRate} Hz · ${result.channels} channels · ${result.bitsPerSample}-bit · ${result.duration.toFixed(3)} s · ${result.clippedSamples} clipped samples`
    : "";
  get("start").disabled = active || changing;
  get("pause").disabled = !["playing", "replaying"].includes(state);
  get("resume").disabled = state !== "paused";
  get("stop").disabled = !active;
  get("replay").disabled = !ready || changing;
  get("duration").disabled = active || changing;
  get("environment").disabled = active || changing;
  get("place").disabled = get("dense").disabled = state !== "playing";
  get("prepare").disabled = !ready || status.busy;
  get("cancel").disabled = !status.busy || status.state !== "rendering";
  get("download").disabled = !result;
  get("clear-export").disabled = !result && !status.busy;
  if (d?.error) message(d.error);
}

async function start() {
  changing = true;
  try {
    const previous = controller;
    const disposal = previous?.dispose().catch(error => message(error.message));
    controller = new CosmicEchoesController(canvas, { duration: Number(get("duration").value), environment: get("environment").value });
    controller.setMonitoringVolume(get("volume").valueAsNumber);
    const playing = controller.startSession();
    refresh();
    try { return await playing; }
    finally { await disposal; }
  } finally { changing = false; }
}

function place(x, y, dense = false) {
  if (!controller) return;
  controller.setRecursionConfig({ ...DEFAULT_CONFIG,
    maxDepth: dense ? 0 : get("depth").valueAsNumber, childrenPerStar: get("children").valueAsNumber });
  const placed = controller.placeStar(x, y);
  message(placed.accepted ? `Placed ${placed.eventCount} celestial events.` : placed.message);
  refresh();
}
canvas.addEventListener("pointerup", event => {
  if (!event.isPrimary || event.button !== 0) return;
  const point = pointerToNormalized(canvas, event.clientX, event.clientY);
  if (point) place(point.x, point.y);
});
get("place").addEventListener("click", () => place(0.5, 0.62));
get("dense").addEventListener("click", () => {
  for (let index = 0; index < 12; index += 1) place(0.12 + index * 0.07, 0.61, true);
});
get("volume").addEventListener("input", () => controller?.setMonitoringVolume(get("volume").valueAsNumber));

for (const [id, action] of Object.entries({
  start, pause: () => controller.pause(), resume: () => controller.resume(),
  stop: () => controller.stop(), replay: () => controller.replay(), reset: () => controller?.reset(),
})) get(id).addEventListener("click", async () => {
  try { await action(); message(`Session: ${controller?.getState() ?? "idle"}.`); }
  catch (error) { message(error.message); }
  refresh();
});

get("prepare").addEventListener("click", async () => {
  exportError("");
  try {
    const pending = exporter.prepare(controller);
    refresh();
    await pending;
  } catch (error) { exportError(error.message); }
  refresh();
});
get("cancel").addEventListener("click", () => { exporter.cancel(); refresh(); });
get("clear-export").addEventListener("click", () => { exporter.clear(); exportError(""); refresh(); });
get("download").addEventListener("click", () => {
  try { exporter.download(); exportError(""); }
  catch (error) { exportError(error.message); }
  refresh();
});
let timer = setInterval(refresh, 150);
window.addEventListener("pagehide", (event) => {
  clearInterval(timer);
  if (event.persisted) controller?.stop();
  else { exporter.dispose(); controller?.dispose().catch(() => {}); }
});
window.addEventListener("pageshow", (event) => { if (event.persisted) timer = setInterval(refresh, 150); });
refresh();
