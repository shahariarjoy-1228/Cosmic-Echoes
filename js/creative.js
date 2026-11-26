import { DEFAULT_CONFIG, validateConfig } from "./recursion.js";

function preset(name, description, config) {
  return Object.freeze({ name, description, config: Object.freeze(validateConfig(config)) });
}

export const RECURSION_PRESETS = Object.freeze({
  "quiet-orbit": preset("Quiet Orbit", "Sparse, gentle echoes for hands-free listening.", {
    maxDepth: 2, childrenPerStar: 1, decay: 0.65, spreadAngle: 60, generationDelay: 1.5, tempo: 45,
  }),
  starlight: preset("Starlight", "The original balanced soundscape.", DEFAULT_CONFIG),
  "nebula-bloom": preset("Nebula Bloom", "Rich, slowly unfolding celestial patterns.", {
    maxDepth: 3, childrenPerStar: 3, decay: 0.60, spreadAngle: 140, generationDelay: 1.2, tempo: 50,
  }),
  "cosmic-cascade": preset("Cosmic Cascade", "Dense branches that use recording capacity quickly.", {
    maxDepth: 4, childrenPerStar: 3, decay: 0.55, spreadAngle: 120, generationDelay: 0.8, tempo: 65,
  }),
});

export function getRecursionPreset(id) {
  if (!Object.hasOwn(RECURSION_PRESETS, id)) throw new RangeError("Unknown recursion preset.");
  return { ...RECURSION_PRESETS[id].config };
}

export function identifyMatchingPreset(config) {
  return Object.keys(RECURSION_PRESETS).find(id => Object.keys(DEFAULT_CONFIG)
    .every(key => config[key] === RECURSION_PRESETS[id].config[key])) ?? "custom";
}

export const MEDITATION_INTERVAL = 5;

function isPosition(position) {
  return Number.isFinite(position) && position >= 0;
}

// The caller supplies audio time and drives checks. This scheduler owns no timer.
export function createMeditationScheduler() {
  let next = null;
  let sequence = 0;
  const disable = () => { next = null; sequence = 0; };
  return {
    get enabled() { return next !== null; },
    enable(position) {
      if (!isPosition(position)) throw new RangeError("A finite playback position is required.");
      next ??= position + MEDITATION_INTERVAL;
    },
    disable,
    tick(state, position, placeStar) {
      if (next === null) return null;
      if (state === "paused") return null;
      if (state !== "playing") {
        disable();
        return null;
      }
      if (!isPosition(position) || position < next) return null;

      // Schedule from the observed time so a throttled tab never catches up in bursts.
      next = position + MEDITATION_INTERVAL;
      const index = ++sequence;
      const x = 0.15 + 0.7 * ((index * 0.61803398875) % 1);
      const y = 0.15 + 0.7 * ((index * 0.41421356237) % 1);
      let result;
      try { result = placeStar(x, y); }
      catch (error) { result = { accepted: false, reason: "integration-failure", message: error.message }; }
      if (!result?.accepted && result?.reason !== "event-capacity") disable();
      return result ?? { accepted: false, reason: "integration-failure", message: "The placement did not finish." };
    },
  };
}
