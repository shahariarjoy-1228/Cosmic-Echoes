import { AudioEngine } from "../js/audio.js";
import { DEFAULT_CONFIG, canFitTree, generateEchoTree } from "../js/recursion.js";
import { MUSICAL_SCALES, generateAmbientHarmony, mapCelestialEventsToMusic } from "../js/music.js";

const get = (id) => document.getElementById(id);
const value = (id) => get(id).valueAsNumber;
const engine = new AudioEngine();
let generated = false;
let busy = false;
let celestialCount = 0;
let rawCount = 0;
let scale = "";
let loadedScenario = "full";

for (const [id, definition] of Object.entries(MUSICAL_SCALES)) {
  get("scale").add(new Option(definition.environment, id));
}

function updateStatus() {
  const state = engine.getState();
  const stats = engine.getDiagnostics();
  const status = `Playback: ${state}. Audio context: ${stats.contextState}.`;
  if (get("status").textContent !== status) get("status").textContent = status;
  get("diagnostics").textContent =
    `Celestial events: ${celestialCount} · Raw notes: ${rawCount} · Retained melody so far: ${stats.retainedMelodic} · ` +
    `Suppressed: ${stats.suppressedEventCount} · Active melody: ${stats.activeMelodicVoiceCount} · Peak melody: ${stats.peakMelodicVoiceCount} · ` +
    `Pads: ${stats.ambientVoiceCount} · Atmosphere sources: ${stats.atmosphereLayerCount} · ` +
    `Position: ${engine.getPlaybackPosition().toFixed(2)} / ${engine.getDuration().toFixed(2)} s · Scale: ${scale || "—"}`;
  if (stats.error) get("error").textContent = stats.error;
  get("play").disabled = busy || !generated || state === "playing" || state === "paused";
  get("pause").disabled = busy || state !== "playing";
  get("resume").disabled = busy || state !== "paused";
  get("stop").disabled = !busy && state !== "playing" && state !== "paused";
  get("replay").disabled = busy || !generated;
}

function applyMix() {
  engine.setMasterVolume(value("volume"));
  engine.setReverbMix(value("reverb"));
  engine.setAmbientVolume(value("ambient"));
  engine.setAtmosphereVolume(["melody", "one", "ambient"].includes(loadedScenario) ? 0 : value("atmosphere"));
}

get("composition").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const scenario = get("scenario").value;
    let config = {
      maxDepth: value("depth"), childrenPerStar: value("children"), decay: value("decay"),
      spreadAngle: value("spread"), generationDelay: value("delay"), tempo: value("tempo"),
    };
    if (scenario === "one") config.maxDepth = 0;
    if (scenario === "binary") config = DEFAULT_CONFIG;
    if (scenario === "ternary") config = { ...config, maxDepth: 4, childrenPerStar: 3 };
    const root = { id: "demo", x: value("x"), y: value("y") };
    const celestial = scenario === "ambient" ? [] : generateEchoTree(root, config);
    if (scenario === "multiple" && canFitTree(config, celestial.length)) {
      celestial.push(...generateEchoTree({ id: "demo-second", x: 1 - root.x, y: 1 - root.y }, config, 0.65));
    }
    const musicConfig = { scaleId: get("scale").value };
    const notes = mapCelestialEventsToMusic(celestial, musicConfig);
    const duration = Math.max(5, ...notes.map((note) => note.startTime + note.duration + 2));
    const ambient = ["melody", "one"].includes(scenario) ? [] : generateAmbientHarmony(musicConfig, 0, duration);
    engine.loadComposition({ notes, ambient, duration });
    loadedScenario = scenario;
    applyMix();
    generated = true;
    celestialCount = celestial.length;
    rawCount = notes.length;
    scale = musicConfig.scaleId;
    get("notes").replaceChildren(...notes.slice(0, 12).map((note) => {
      const row = document.createElement("tr");
      for (const text of [note.noteName, note.instrument, note.startTime.toFixed(2), note.duration.toFixed(2)]) {
        row.insertCell().textContent = text;
      }
      return row;
    }));
    get("error").textContent = "";
  } catch (error) {
    get("error").textContent = error.message;
  }
  updateStatus();
});

for (const id of ["volume", "reverb", "ambient", "atmosphere"]) get(id).addEventListener("input", applyMix);
for (const [id, action] of Object.entries({
  play: () => engine.play(), pause: () => engine.pause(), resume: () => engine.resume(),
  replay: () => { engine.stop(); return engine.play(); },
})) {
  get(id).addEventListener("click", async () => {
    busy = true;
    get("error").textContent = "";
    updateStatus();
    try { await action(); } catch (error) { get("error").textContent = error.message; }
    finally { busy = false; updateStatus(); }
  });
}
get("stop").addEventListener("click", () => { engine.stop(); updateStatus(); });
setInterval(updateStatus, 150);
window.addEventListener("pagehide", (event) => {
  if (event.persisted) engine.stop();
  else engine.dispose().catch(() => {});
});
updateStatus();
