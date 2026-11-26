export const MAX_EVENTS_PER_ROOT = 121;
export const GLOBAL_EVENT_BUDGET = 300;

export const DEFAULT_CONFIG = Object.freeze({
  maxDepth: 3,
  childrenPerStar: 2,
  decay: 0.65,
  spreadAngle: 100,
  generationDelay: 0.8,
  tempo: 55,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value, fallback, min, max, integer = false) {
  if (!Number.isFinite(value)) return fallback;
  return clamp(integer ? Math.round(value) : value, min, max);
}

export function validateConfig(config) {
  const input = config ?? {};
  return {
    maxDepth: normalize(input.maxDepth, DEFAULT_CONFIG.maxDepth, 0, 4, true),
    childrenPerStar: normalize(input.childrenPerStar, DEFAULT_CONFIG.childrenPerStar, 1, 3, true),
    decay: normalize(input.decay, DEFAULT_CONFIG.decay, 0.35, 0.85),
    spreadAngle: normalize(input.spreadAngle, DEFAULT_CONFIG.spreadAngle, 30, 180),
    generationDelay: normalize(input.generationDelay, DEFAULT_CONFIG.generationDelay, 0.4, 2),
    tempo: normalize(input.tempo, DEFAULT_CONFIG.tempo, 40, 80),
  };
}

export function countEvents(maxDepth, childrenPerStar) {
  const config = validateConfig({ maxDepth, childrenPerStar });
  let total = 0;
  let levelSize = 1;
  for (let depth = 0; depth <= config.maxDepth; depth += 1) {
    total += levelSize;
    levelSize *= config.childrenPerStar;
  }
  return total;
}

export function canFitTree(config, pendingAndActiveCount) {
  if (!Number.isSafeInteger(pendingAndActiveCount) || pendingAndActiveCount < 0) return false;

  const { maxDepth, childrenPerStar } = validateConfig(config);
  const treeSize = countEvents(maxDepth, childrenPerStar);
  return treeSize <= MAX_EVENTS_PER_ROOT && treeSize <= GLOBAL_EVENT_BUDGET - pendingAndActiveCount;
}

export function generateEchoTree(root, config, startTime = 0) {
  if (typeof root?.id !== "string" || root.id.trim() === "") {
    throw new TypeError("A nonempty root ID is required.");
  }
  if (!Number.isFinite(root.x) || !Number.isFinite(root.y)) {
    throw new TypeError("Root coordinates must be finite numbers.");
  }

  const settings = validateConfig(config);
  if (countEvents(settings.maxDepth, settings.childrenPerStar) > MAX_EVENTS_PER_ROOT) {
    throw new RangeError("The tree exceeds the per-root event limit.");
  }

  const delay = settings.generationDelay * DEFAULT_CONFIG.tempo / settings.tempo;
  const spread = settings.spreadAngle * Math.PI / 180;
  const initialTime = Number.isFinite(startTime) ? Math.max(0, startTime) : 0;
  const startTimes = [initialTime];
  for (let depth = 1; depth <= settings.maxDepth; depth += 1) {
    const previousTime = startTimes[depth - 1];
    const nextTime = previousTime + delay;
    if (!Number.isFinite(nextTime) || nextTime <= previousTime) {
      throw new RangeError("Start time is too large to represent the generation delay.");
    }
    startTimes.push(nextTime);
  }

  // JSON quoting keeps IDs distinct even when a root identifier contains separators.
  const rootEvent = {
    id: JSON.stringify([root.id]),
    rootId: root.id,
    parentId: null,
    x: clamp(root.x, 0, 1),
    y: clamp(root.y, 0, 1),
    depth: 0,
    radius: 0.12,
    angle: -Math.PI / 2,
    startTime: initialTime,
    duration: 1.2,
    amplitude: normalize(root.amplitude, 1, 0, 1),
    childIndex: null,
  };

  const events = [];
  function addEchoes(parent, path) {
    events.push(parent);
    if (parent.depth === settings.maxDepth) return;

    for (let childIndex = 0; childIndex < settings.childrenPerStar; childIndex += 1) {
      const offset = settings.childrenPerStar === 1
        ? 0
        : spread * (childIndex / (settings.childrenPerStar - 1) - 0.5);
      const angle = parent.angle + offset;
      const childPath = [...path, childIndex];

      addEchoes({
        id: JSON.stringify([root.id, ...childPath]),
        rootId: root.id,
        parentId: parent.id,
        x: clamp(parent.x + Math.cos(angle) * parent.radius, 0, 1),
        y: clamp(parent.y + Math.sin(angle) * parent.radius, 0, 1),
        depth: parent.depth + 1,
        radius: parent.radius * settings.decay,
        angle,
        startTime: startTimes[parent.depth + 1],
        duration: parent.duration * settings.decay,
        amplitude: parent.amplitude * settings.decay,
        childIndex,
      }, childPath);
    }
  }

  addEchoes(rootEvent, []);
  return events;
}
