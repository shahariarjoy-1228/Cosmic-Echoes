import { CosmicEchoesController, DEFAULT_CONTROLLER_CONFIG } from "./js/controller.js";
import { DEFAULT_CONFIG, countEvents } from "./js/recursion.js";
import { getScale } from "./js/music.js";
import { VISUAL_THEMES, pointerToNormalized } from "./js/visuals.js";
import { WavExporter } from "./js/export.js";

const get = id => document.getElementById(id);
const text = (id, value) => {
  const element = get(id);
  if (element.textContent !== value) element.textContent = value;
};
const showError = (id, message) => {
  text(id, message);
  get(id).hidden = !message;
};
const errorMessage = error => error instanceof Error ? error.message : String(error);
const canvas = get("sky");
const settings = Object.keys(DEFAULT_CONFIG);
const exporter = new WavExporter();
const listeners = new AbortController();
const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: listeners.signal });
const descriptions = {
  "deep-space": "Calm and spacious",
  "nebula-dreams": "Soft and dreamlike",
  "solar-harmony": "Warm and radiant",
};
const scaleNames = {
  "c-major-pentatonic": "C major pentatonic",
  "a-minor-pentatonic": "A minor pentatonic",
  "f-major-pentatonic": "F major pentatonic",
};
const stateLabels = {
  idle: "Idle", initializing: "Starting audio", playing: "Recording", paused: "Paused",
  stopped: "Stopped", completed: "Completed", replaying: "Replaying", disposed: "Closed",
};
const reasons = {
  "event-capacity": "The sky is full. Wait for some echoes to fade.",
  "recording-capacity": "This recording has reached its event limit.",
  "session-duration": "Not enough session time remains for this tree.",
};
let controller;
let timer;
let disposed = false;
let transition = false;
let transportRevision = 0;
let lastState;
let finalized = null;
let pendingPointer = null;
let lastEngineError = "";

for (const [id, theme] of Object.entries(VISUAL_THEMES)) get("environment").add(new Option(theme.name, id));
get("environment").value = DEFAULT_CONTROLLER_CONFIG.environment;
for (const key of settings) get(key).value = DEFAULT_CONFIG[key];

function clock(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function describeEnvironment(id) {
  const { scaleId } = VISUAL_THEMES[id];
  const scale = getScale(scaleId);
  text("environment-description", `${descriptions[id]} · ${scaleNames[scaleId] ?? scale.environment}`);
}

function applyRecursion() {
  const config = controller.setRecursionConfig(Object.fromEntries(
    settings.map(key => [key, get(key).valueAsNumber]),
  ));
  const suffixes = { tempo: " BPM", spreadAngle: "°", generationDelay: " s" };
  for (const key of settings) text(`${key}-value`, config[key] + (suffixes[key] ?? ""));
  const stars = countEvents(config.maxDepth, config.childrenPerStar);
  text("recursion-preview", `${stars} ${stars === 1 ? "star" : "stars"} per placement · ${config.maxDepth + 1} ${config.maxDepth ? "generations" : "generation"}`);
}

function refresh() {
  if (disposed || !controller) return;
  const d = controller.getDiagnostics();
  const state = d.state;
  const active = ["initializing", "playing", "paused", "replaying"].includes(state);
  if (state !== lastState) {
    if (state === "completed" && d.mode === "record") text("notice", "Session complete. Your recording is ready.");
    if (state === "completed" && d.mode === "replay") text("notice", "Replay complete.");
    finalized = ["stopped", "completed"].includes(state) ? controller.getCompositionSnapshot() : null;
    lastState = state;
  }
  const ready = Boolean(finalized?.endpoint >= 0.000001);
  const prompt = {
    idle: "Start a session to create stars.",
    initializing: "Starting audio…",
    playing: "Click or tap to place a star. Keyboard placement is below.",
    paused: "Resume the session to place another star.",
    stopped: "Start a new session to create more stars.",
    completed: "Start a new session to create more stars.",
    replaying: "Your recorded stars are playing back.",
  };
  document.documentElement.dataset.theme = d.visual.theme;
  text("sky-environment", VISUAL_THEMES[d.visual.theme].name);
  text("session-state", state === "paused" && d.mode === "replay" ? "Replay paused" : stateLabels[state]);
  get("onboarding").hidden = state !== "idle";
  text("sky-help", prompt[state] ?? "The sky is unavailable.");
  text("session-time", `${clock(d.position)} / ${clock(d.duration)}`);
  get("playhead").max = Math.max(1, d.duration);
  get("playhead").value = d.position;
  get("start").disabled = active || transition;
  get("pause").hidden = state === "paused";
  get("pause").disabled = transition || !["playing", "replaying"].includes(state);
  get("resume").hidden = state !== "paused";
  get("resume").disabled = transition || state !== "paused";
  get("stop").disabled = !active;
  get("replay").disabled = !ready || transition;
  get("reset").disabled = state === "idle";
  get("center").disabled = get("place").disabled = state !== "playing" || transition;
  get("environment").disabled = active || transition;
  get("environment-lock").hidden = !active;
  text("recording", ready
    ? `${VISUAL_THEMES[finalized.environment].name} · ${finalized.endpoint.toFixed(2)} s · ${d.recordedEvents} recorded stars · ${finalized.admitted.filter(note => note.role !== "ambient").length} melody notes`
    : state === "playing" || (state === "paused" && d.mode === "record")
      ? `Recording composition · ${d.recordedEvents} stars accepted`
      : "Stop or finish a session to prepare a WAV.");

  const status = exporter.getStatus();
  const wav = exporter.getResult();
  get("prepare").disabled = !ready || status.busy || transition;
  get("download").disabled = !wav;
  get("cancel").hidden = get("cancel").disabled = status.state !== "rendering";
  get("clear-export").hidden = get("clear-export").disabled = !wav;
  text("export-status", status.state === "idle" ? "" : status.message);
  get("wav-metadata").hidden = !wav;
  if (wav) text("wav-metadata", `${wav.filename} · ${wav.duration.toFixed(3)} s · ${wav.byteLength.toLocaleString()} bytes · 44.1 kHz · Stereo · 16-bit PCM`);
  if (d.error && d.error !== lastEngineError) showError("error", d.error);
  lastEngineError = d.error;
  if (get("diagnostics-panel").open) {
    text("diagnostics", `${stateLabels[state]} · Audio ${d.audio.contextState} · ${d.position.toFixed(2)} s · ` +
      `Pending ${d.pending} · Active ${d.active} · Free ${d.remaining} · Roots ${d.acceptedRoots} · Recorded ${d.recordedEvents} · ` +
      `Voices ${d.audio.activeMelodicVoiceCount} / peak ${d.audio.peakMelodicVoiceCount} · Suppressed ${d.audio.suppressedEventCount} · ` +
      `${d.environment} · Standard quality · ${d.visual.reducedMotion ? "Reduced" : "Full"} motion · DPR ${d.visual.dpr.toFixed(2)} · ` +
      `${d.visual.fps > 0 ? d.visual.fps.toFixed(0) + " FPS (approx.) · " : ""}Logical render gap ${(d.logicalTimelineDifference * 1000).toFixed(1)} ms · Export ${status.state}`);
  }
}

function clearPrepared() {
  exporter.clear();
  showError("export-error", "");
}

const actions = {
  start: async () => {
    clearPrepared();
    if (await controller.startSession()) text("notice", "Session started. Place a star to begin.");
  },
  pause: async () => { if (await controller.pause()) text("notice", "Session paused."); },
  resume: async () => { if (await controller.resume()) text("notice", "Session resumed."); },
  stop: () => {
    controller.stop();
    text("notice", "Session stopped. A recording with elapsed time can be replayed or exported.");
  },
  replay: async () => { if (await controller.replay()) text("notice", "Replaying your recording."); },
  reset: () => {
    controller.reset();
    clearPrepared();
    text("notice", "Recording cleared. Start a session when ready.");
  },
};

const focusAfter = { start: "center", pause: "resume", resume: "pause", stop: "replay", replay: "pause", reset: "start" };
function bindTransport() {
  for (const [id, action] of Object.entries(actions)) {
    listen(get(id), "click", async () => {
      if (disposed || (transition && !["stop", "reset"].includes(id))) return;
      const revision = ++transportRevision;
      const hadFocus = document.activeElement === get(id);
      transition = true;
      showError("error", "");
      try {
        const operation = action();
        refresh();
        await operation;
      } catch (error) {
        if (!disposed && revision === transportRevision) showError("error", errorMessage(error));
      } finally {
        if (!disposed && revision === transportRevision) {
          transition = false;
          refresh();
          const focus = get(focusAfter[id]);
          if (hadFocus && [document.body, get(id)].includes(document.activeElement) && !focus.disabled) focus.focus();
        }
      }
    });
  }
}

function place(x, y) {
  if (transition || disposed) return;
  showError("error", "");
  const placed = controller.placeStar(x, y);
  text("notice", placed.accepted
    ? `Star placed · ${placed.eventCount} ${placed.eventCount === 1 ? "celestial event" : "celestial events"}.`
    : reasons[placed.reason] ?? get("sky-help").textContent);
  if (!placed.accepted && placed.reason !== "invalid-state" && !reasons[placed.reason]) showError("error", placed.message);
  refresh();
}

function bindPlacement() {
  listen(canvas, "pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    pendingPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  listen(canvas, "pointermove", event => {
    if (pendingPointer?.id === event.pointerId &&
        Math.hypot(event.clientX - pendingPointer.x, event.clientY - pendingPointer.y) > 12) pendingPointer = null;
  });
  listen(canvas, "pointercancel", () => { pendingPointer = null; });
  listen(canvas, "pointerleave", () => { pendingPointer = null; });
  listen(canvas, "pointerup", event => {
    if (pendingPointer?.id !== event.pointerId) return;
    const start = pendingPointer;
    pendingPointer = null;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
    const point = pointerToNormalized(canvas, event.clientX, event.clientY);
    if (point) place(point.x, point.y);
  });
  listen(get("center"), "click", () => place(0.5, 0.5));
  listen(get("placement"), "submit", event => {
    event.preventDefault();
    place(get("x").valueAsNumber, get("y").valueAsNumber);
  });
}

function bindExport() {
  listen(get("prepare"), "click", async () => {
    const revision = transportRevision;
    showError("export-error", "");
    try {
      const operation = exporter.prepare(controller);
      refresh();
      await operation;
    } catch (error) {
      if (!disposed && revision === transportRevision) showError("export-error", errorMessage(error));
    }
    refresh();
  });
  listen(get("cancel"), "click", () => { exporter.cancel(); refresh(); });
  listen(get("clear-export"), "click", () => { clearPrepared(); refresh(); });
  listen(get("download"), "click", () => {
    showError("export-error", "");
    try { exporter.download(); }
    catch (error) { showError("export-error", errorMessage(error)); }
    refresh();
  });
}

try {
  controller = new CosmicEchoesController(canvas);
  controller.setMonitoringVolume(get("volume").valueAsNumber);
  applyRecursion();
  describeEnvironment(get("environment").value);
  bindTransport();
  bindPlacement();
  bindExport();
  for (const key of settings) listen(get(key), "input", applyRecursion);
  listen(get("environment"), "change", event => {
    showError("error", "");
    try {
      controller.setEnvironment(event.target.value);
      describeEnvironment(event.target.value);
    } catch (error) {
      event.target.value = controller.getDiagnostics().environment;
      showError("error", errorMessage(error));
    }
    refresh();
  });
  listen(get("volume"), "input", event => {
    controller.setMonitoringVolume(event.target.valueAsNumber);
    text("volume-value", `${Math.round(event.target.valueAsNumber * 100)}%`);
  });
  for (const [id, update] of Object.entries({
    motion: input => controller.setReducedMotion(input.value),
    particles: input => controller.setParticlesEnabled(input.checked),
    ripples: input => controller.setRipplesEnabled(input.checked),
    connections: input => controller.setConnectionsEnabled(input.checked),
  })) listen(get(id), "change", event => { update(event.target); refresh(); });
  listen(get("diagnostics-panel"), "toggle", refresh);
  listen(document.querySelector(".help-link"), "click", () => { document.querySelector("#about details").open = true; });
  timer = setInterval(refresh, 150);
  listen(window, "pagehide", event => {
    clearInterval(timer);
    if (event.persisted) {
      transportRevision += 1;
      transition = false;
      controller.stop();
      exporter.cancel();
    } else {
      disposed = true;
      listeners.abort();
      exporter.dispose();
      controller.dispose().catch(() => {});
    }
  });
  listen(window, "pageshow", event => {
    if (event.persisted) { timer = setInterval(refresh, 150); refresh(); }
  });
  refresh();
} catch (error) {
  disposed = true;
  clearInterval(timer);
  listeners.abort();
  exporter.dispose();
  controller?.dispose().catch(() => {});
  text("session-state", "Unavailable");
  showError("error", errorMessage(error));
}
