import { GLOBAL_EVENT_BUDGET, MAX_EVENTS_PER_ROOT } from "./recursion.js";

export const VISUAL_THEMES = Object.freeze({
  "deep-space": Object.freeze({ name: "Deep Space", scaleId: "c-major-pentatonic", background: "#080d1e",
    haze: "#171f44", edge: "#0a1022", glow: "#668df5", core: "#dae7ff", line: "#92adf4", particle: "#aec7ff" }),
  "nebula-dreams": Object.freeze({ name: "Nebula Dreams", scaleId: "a-minor-pentatonic", background: "#120c21",
    haze: "#301c43", edge: "#160f27", glow: "#b58aea", core: "#f3ddfb", line: "#c09ee7", particle: "#e4beef" }),
  "solar-harmony": Object.freeze({ name: "Solar Harmony", scaleId: "f-major-pentatonic", background: "#171111",
    haze: "#36251e", edge: "#1d1515", glow: "#e6a563", core: "#ffecd8", line: "#dcb082", particle: "#f2ccad" }),
});

export const DEFAULT_VISUAL_CONFIG = Object.freeze({
  theme: "deep-space", motion: "auto", particleCount: 100, maxDpr: 2, seed: 1729,
  particles: true, glow: true, ripples: true, connections: true, quality: "standard",
  maxActiveEvents: GLOBAL_EVENT_BUDGET, maxOccupiedEvents: GLOBAL_EVENT_BUDGET, maxEventsPerRoot: MAX_EVENTS_PER_ROOT,
});

const MAX_PIXELS = 8_000_000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const unit = (value) => clamp(value, 0, 1);
const inUnit = (value) => Number.isFinite(value) && value >= 0 && value <= 1;
const isId = (value) => typeof value === "string" && value.trim().length > 0;

function bounded(value, fallback, min, max) {
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function requireTheme(theme) {
  if (typeof theme !== "string" || !Object.hasOwn(VISUAL_THEMES, theme)) throw new RangeError("Unknown visual theme.");
}

function requireChoice(value, options, label) {
  if (!options.includes(value)) throw new RangeError(`Unknown ${label}.`);
  return value;
}

export function validateVisualConfig(input = {}) {
  const config = input ?? {};
  const theme = config.theme ?? DEFAULT_VISUAL_CONFIG.theme;
  requireTheme(theme);
  return {
    ...DEFAULT_VISUAL_CONFIG,
    theme,
    motion: requireChoice(config.motion ?? "auto", ["auto", "full", "reduced"], "motion preference"),
    particleCount: Math.round(bounded(config.particleCount, 100, 0, 200)),
    maxDpr: bounded(config.maxDpr, 2, 1, 2),
    seed: Math.round(bounded(config.seed, 1729, 0, 0xffffffff)),
    particles: typeof config.particles === "boolean" ? config.particles : true,
    glow: typeof config.glow === "boolean" ? config.glow : true,
    ripples: typeof config.ripples === "boolean" ? config.ripples : true,
    connections: typeof config.connections === "boolean" ? config.connections : true,
    quality: requireChoice(config.quality ?? "standard", ["standard", "reduced"], "visual quality"),
  };
}

function checkCoordinates(x, y, width, height) {
  if (![x, y, width, height].every(Number.isFinite) || width < 0 || height < 0) {
    throw new RangeError("Coordinates and canvas dimensions must be finite, with nonnegative dimensions.");
  }
}

export function normalizedToCanvas(x, y, width, height) {
  checkCoordinates(x, y, width, height);
  return { x: unit(x) * width, y: unit(y) * height };
}

export function canvasToNormalized(x, y, width, height) {
  checkCoordinates(x, y, width, height);
  return width && height ? { x: unit(x / width), y: unit(y / height) } : null;
}

export function pointerToNormalized(canvas, clientX, clientY) {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  return canvasToNormalized(clientX - left, clientY - top, width, height);
}

function requirePosition(time) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError("Timeline position must be finite and nonnegative.");
}

export function getEventVisualState(event, time) {
  requirePosition(time);
  if (!Number.isFinite(event?.startTime) || event.startTime < 0 ||
      !Number.isFinite(event.duration) || event.duration <= 0 ||
      !Number.isFinite(event.startTime + event.duration) || event.startTime + event.duration <= event.startTime) {
    throw new RangeError("Invalid celestial lifetime.");
  }
  const age = time - event.startTime;
  const progress = unit(age / event.duration);
  const status = time < event.startTime ? "pending" : time >= event.startTime + event.duration ? "expired" : "active";
  return { status, age, progress };
}

function smooth(value) {
  const t = unit(value);
  return t * t * (3 - 2 * t);
}

export function getVisualMetrics(event, progress, shortestSide, reducedMotion = false) {
  const p = unit(progress);
  const fade = smooth(p / 0.14) * (1 - smooth((p - 0.55) / 0.45));
  const radius = clamp(event.radius * shortestSide * 0.32, 0.65, 44);
  const opacity = fade * Math.sqrt(event.amplitude) * (0.96 - event.depth * 0.06);
  return {
    radius, opacity,
    rippleRadius: radius * (1 + 4 * (1 - (1 - p) ** 2)),
    rippleOpacity: reducedMotion ? 0 : opacity * (1 - p) * 0.44,
  };
}

function checkEvent(event) {
  if (!isId(event?.id) || !isId(event.rootId)) throw new TypeError("Celestial event and root IDs are required.");
  getEventVisualState(event, 0);
  if (!inUnit(event.x) || !inUnit(event.y) || !inUnit(event.amplitude) ||
      !Number.isFinite(event.radius) || event.radius <= 0 || !Number.isFinite(event.angle) ||
      !Number.isInteger(event.depth) || event.depth < 0 || event.depth > 4) {
    throw new RangeError("Invalid celestial geometry, amplitude or depth.");
  }
  if (event.depth === 0) {
    if (event.parentId !== null || event.childIndex !== null) throw new TypeError("Root must have null parent and child index.");
  } else if (!isId(event.parentId) || !Number.isInteger(event.childIndex) || event.childIndex < 0 || event.childIndex > 2) {
    throw new TypeError("An echo needs a parent ID and child index from 0 to 2.");
  }
}

function generateParticles(count, seed) {
  let state = seed;
  function next() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  return Array.from({ length: count }, () => ({
    x: next(), y: next(), size: 0.45 + next() * 0.85, alpha: 0.13 + next() * 0.34, phase: next() * Math.PI * 2,
  }));
}

export class VisualEngine {
  #canvas;
  #ctx;
  #view;
  #config;
  #observer;
  #preference;
  #events = new Map();
  #parents = new Map();
  #roots = new Map();
  #particles;
  #visible = [];
  #visibleRoots = new Set();
  #referencedParents = new Set();
  #background;
  #glow;
  #width = 0;
  #height = 0;
  #dpr = 1;
  #position = 0;
  #pending = 0;
  #activeRoots = 0;
  #expired = 0;
  #frame = null;
  #lastFrame = null;
  #fps = 0;
  #provider = null;
  #state = "idle";
  #error = "";

  constructor(canvas, config) {
    this.#config = validateVisualConfig(config);
    if (typeof canvas?.getContext !== "function" || typeof canvas.getBoundingClientRect !== "function" ||
        !canvas.ownerDocument?.defaultView) throw new TypeError("Supply a Canvas element.");
    this.#ctx = canvas.getContext("2d");
    if (!this.#ctx) throw new Error("Canvas 2D is unavailable.");
    this.#canvas = canvas;
    this.#view = canvas.ownerDocument.defaultView;
    this.#particles = generateParticles(this.#config.particleCount, this.#config.seed);
    this.#preference = this.#view.matchMedia?.("(prefers-reduced-motion: reduce)");
    this.#preference?.addEventListener?.("change", this.#onPreference);
    if (!this.#preference?.addEventListener) this.#preference?.addListener?.(this.#onPreference);
    if (typeof this.#view.ResizeObserver === "function") {
      this.#observer = new this.#view.ResizeObserver(this.#onResize);
      this.#observer.observe(canvas);
    }
    this.#view.addEventListener("resize", this.#onResize);
    this.resize();
  }

  #requireOpen() {
    if (this.#state === "disposed") throw new Error("Visual engine is disposed.");
  }

  #onResize = () => {
    if (this.#state !== "disposed") this.resize();
  };

  #onPreference = () => {
    if (this.#state !== "disposed" && this.#config.motion === "auto") this.renderAt(this.#position);
  };

  #isReduced() {
    return this.#config.motion === "reduced" || (this.#config.motion === "auto" && Boolean(this.#preference?.matches));
  }

  resize() {
    this.#requireOpen();
    const { width, height } = this.#canvas.getBoundingClientRect();
    this.#width = width;
    this.#height = height;
    if (!width || !height) {
      this.#dpr = 1;
      if (this.#canvas.width !== 1) this.#canvas.width = 1;
      if (this.#canvas.height !== 1) this.#canvas.height = 1;
      this.#background = null;
      return;
    }
    this.#dpr = Math.min(this.#view.devicePixelRatio || 1, this.#config.maxDpr,
      4096 / Math.max(width, height), Math.sqrt(MAX_PIXELS / (width * height)));
    const pixelWidth = Math.max(1, Math.floor(width * this.#dpr));
    const pixelHeight = Math.max(1, Math.floor(height * this.#dpr));
    if (this.#canvas.width !== pixelWidth) this.#canvas.width = pixelWidth;
    if (this.#canvas.height !== pixelHeight) this.#canvas.height = pixelHeight;
    this.#background = null;
    this.renderAt(this.#position);
  }

  addEvents(batch) {
    this.#requireOpen();
    if (!Array.isArray(batch) || batch.length > GLOBAL_EVENT_BUDGET) throw new RangeError("Use at most 300 celestial events per batch.");
    const incoming = new Map();
    const counts = new Map();
    const newRoots = new Set();
    for (const event of batch) {
      checkEvent(event);
      if (incoming.has(event.id) || this.#events.has(event.id) || this.#parents.has(event.id)) {
        throw new TypeError("Duplicate celestial event ID.");
      }
      if (this.#roots.has(event.rootId)) throw new TypeError("Supply a complete tree with a distinct root ID.");
      if (event.startTime + event.duration <= this.#position) throw new RangeError("Cannot add an already expired event.");
      if (event.depth === 0) {
        if (newRoots.has(event.rootId)) throw new TypeError("Duplicate celestial root.");
        newRoots.add(event.rootId);
      }
      const count = (counts.get(event.rootId) ?? 0) + 1;
      if (count > MAX_EVENTS_PER_ROOT) throw new RangeError("A root may contain at most 121 events.");
      counts.set(event.rootId, count);
      incoming.set(event.id, { ...event });
    }
    const branches = new Map();
    for (const event of incoming.values()) {
      if (event.depth === 0) continue;
      const parent = incoming.get(event.parentId);
      if (!parent || parent.rootId !== event.rootId || parent.depth + 1 !== event.depth || parent.startTime > event.startTime) {
        throw new TypeError("Invalid parent, root association, depth or onset.");
      }
      const siblings = branches.get(parent.id) ?? new Set();
      if (siblings.has(event.childIndex)) throw new TypeError("Duplicate child index.");
      siblings.add(event.childIndex);
      branches.set(parent.id, siblings);
    }
    if (incoming.size + this.#events.size > GLOBAL_EVENT_BUDGET) throw new RangeError("The complete tree does not fit the visual capacity.");
    for (const [id, event] of incoming) this.#events.set(id, event);
    for (const [id, count] of counts) this.#roots.set(id, count);
    this.renderAt(this.#position);
    return incoming.size;
  }

  renderAt(time) {
    this.#requireOpen();
    requirePosition(time);
    this.#position = time;
    this.#visible.length = 0;
    this.#pending = 0;
    const activeRoots = this.#visibleRoots;
    const parentIds = this.#referencedParents;
    activeRoots.clear();
    parentIds.clear();
    for (const [id, event] of this.#events) {
      if (time >= event.startTime + event.duration) {
        this.#events.delete(id);
        this.#parents.set(id, { x: event.x, y: event.y });
        this.#expired += 1;
        const remaining = this.#roots.get(event.rootId) - 1;
        if (remaining) this.#roots.set(event.rootId, remaining);
        else this.#roots.delete(event.rootId);
        continue;
      }
      if (event.parentId !== null) parentIds.add(event.parentId);
      if (time < event.startTime) this.#pending += 1;
      else {
        this.#visible.push(event);
        activeRoots.add(event.rootId);
      }
    }
    for (const id of this.#parents.keys()) {
      if (!parentIds.has(id)) this.#parents.delete(id);
    }
    this.#activeRoots = activeRoots.size;
    if (this.#width && this.#height) this.#draw();
  }

  #draw() {
    const ctx = this.#ctx;
    const width = this.#width;
    const height = this.#height;
    const theme = VISUAL_THEMES[this.#config.theme];
    const shortest = Math.min(width, height);
    const reduced = this.#isReduced();
    ctx.setTransform(this.#canvas.width / width, 0, 0, this.#canvas.height / height, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (!this.#background) {
      this.#background = ctx.createRadialGradient(width * 0.30, height * 0.37, 0,
        width * 0.48, height * 0.48, Math.max(width, height) * 0.72);
      this.#background.addColorStop(0, theme.haze);
      this.#background.addColorStop(0.58, theme.edge);
      this.#background.addColorStop(1, theme.background);
    }
    ctx.fillStyle = this.#background;
    ctx.fillRect(0, 0, width, height);
    if (this.#config.particles) {
      ctx.fillStyle = theme.particle;
      const count = Math.ceil(this.#particles.length * (this.#config.quality === "reduced" ? 0.45 : 1));
      const driftTime = (this.#position % 120) * Math.PI / 60;
      for (let i = 0; i < count; i += 1) {
        const p = this.#particles[i];
        const dx = reduced ? 0 : 2.5 * Math.sin(driftTime + p.phase);
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x * width + dx, p.y * height, p.size, p.size);
      }
    }
    ctx.lineWidth = 0.8;
    for (const event of this.#visible) {
      const x = event.x * width;
      const y = event.y * height;
      const progress = unit((this.#position - event.startTime) / event.duration);
      const metrics = getVisualMetrics(event, progress, shortest, reduced);
      if (metrics.opacity <= 0) continue;
      const parent = this.#events.get(event.parentId) ?? this.#parents.get(event.parentId);
      if (parent && this.#config.connections) {
        ctx.strokeStyle = theme.line;
        ctx.globalAlpha = metrics.opacity * 0.44 / Math.sqrt(event.depth);
        ctx.beginPath();
        ctx.moveTo(parent.x * width, parent.y * height);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      if (this.#config.ripples && metrics.rippleOpacity > 0) {
        ctx.strokeStyle = theme.line;
        ctx.globalAlpha = metrics.rippleOpacity;
        ctx.beginPath();
        ctx.arc(x, y, metrics.rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (this.#config.glow && this.#config.quality === "standard") {
        if (!this.#glow) this.#makeGlow(theme);
        ctx.globalAlpha = metrics.opacity * 0.86;
        const glowSize = metrics.radius * 2.8;
        ctx.drawImage(this.#glow, x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);
      }
      ctx.globalAlpha = metrics.opacity * 0.88;
      ctx.fillStyle = theme.core;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, metrics.radius * 0.13), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  #makeGlow(theme) {
    const sprite = this.#canvas.ownerDocument.createElement("canvas");
    sprite.width = sprite.height = 96;
    const ctx = sprite.getContext("2d");
    const gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    gradient.addColorStop(0, theme.core + "ee");
    gradient.addColorStop(0.14, theme.glow + "a0");
    gradient.addColorStop(0.42, theme.glow + "34");
    gradient.addColorStop(1, theme.glow + "00");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 96, 96);
    this.#glow = sprite;
  }

  start(timeProvider) {
    this.#requireOpen();
    if (this.#state === "running") return;
    if (typeof timeProvider !== "function") throw new TypeError("Supply a timeline function returning seconds.");
    this.#provider = timeProvider;
    this.#state = "running";
    this.#lastFrame = null;
    this.#fps = 0;
    this.#error = "";
    this.#frame = this.#view.requestAnimationFrame(this.#tick);
  }

  #tick = (timestamp) => {
    this.#frame = null;
    if (this.#state !== "running") return;
    try {
      if (this.#lastFrame !== null && timestamp > this.#lastFrame) {
        const rate = 1000 / (timestamp - this.#lastFrame);
        this.#fps = this.#fps ? this.#fps * 0.9 + rate * 0.1 : rate;
      }
      this.#lastFrame = timestamp;
      this.renderAt(this.#provider());
      if (this.#state === "running") this.#frame = this.#view.requestAnimationFrame(this.#tick);
    } catch (error) {
      this.#error = error.message;
      this.stop();
    }
  };

  pause() {
    if (this.#state !== "running") return;
    this.#cancelFrame();
    this.#state = "paused";
  }

  resume() {
    if (this.#state === "paused") this.start(this.#provider);
  }

  #cancelFrame() {
    if (this.#frame !== null) this.#view.cancelAnimationFrame(this.#frame);
    this.#frame = null;
    this.#fps = 0;
  }

  stop() {
    if (this.#state === "disposed") return;
    this.#cancelFrame();
    this.#provider = null;
    this.#state = "stopped";
  }

  clear() {
    this.#requireOpen();
    this.#events.clear();
    this.#parents.clear();
    this.#roots.clear();
    this.#expired = 0;
    this.renderAt(this.#position);
  }

  reset() {
    this.#requireOpen();
    this.stop();
    this.#position = 0;
    this.#error = "";
    this.clear();
  }

  setTheme(theme) {
    this.#requireOpen();
    requireTheme(theme);
    if (theme === this.#config.theme) return;
    this.#config.theme = theme;
    this.#glow = this.#background = null;
    this.renderAt(this.#position);
  }

  setReducedMotion(motion) {
    this.#requireOpen();
    this.#config.motion = requireChoice(motion, ["auto", "full", "reduced"], "motion preference");
    this.renderAt(this.#position);
  }

  setQuality(quality) {
    this.#requireOpen();
    this.#config.quality = requireChoice(quality, ["standard", "reduced"], "visual quality");
    this.renderAt(this.#position);
  }

  #setLayer(layer, enabled) {
    this.#requireOpen();
    if (typeof enabled !== "boolean") throw new TypeError("Layer settings require a boolean.");
    this.#config[layer] = enabled;
    this.renderAt(this.#position);
  }

  setParticlesEnabled(enabled) { this.#setLayer("particles", enabled); }
  setRipplesEnabled(enabled) { this.#setLayer("ripples", enabled); }
  setConnectionsEnabled(enabled) { this.#setLayer("connections", enabled); }

  getDiagnostics() {
    return {
      state: this.#state, position: this.#position, pending: this.#pending, active: this.#visible.length,
      expiredSinceClear: this.#expired, occupied: this.#events.size, remaining: GLOBAL_EVENT_BUDGET - this.#events.size,
      activeRoots: this.#activeRoots, storedRoots: this.#roots.size, parentRecords: this.#parents.size,
      width: this.#width, height: this.#height, dpr: this.#dpr, fps: this.#fps,
      theme: this.#config.theme, motion: this.#config.motion, reducedMotion: this.#isReduced(),
      particleCount: this.#particles.length, error: this.#error,
    };
  }

  dispose() {
    if (this.#state === "disposed") return;
    this.stop();
    this.clear();
    this.#state = "disposed";
    this.#observer?.disconnect();
    this.#view.removeEventListener("resize", this.#onResize);
    this.#preference?.removeEventListener?.("change", this.#onPreference);
    if (!this.#preference?.removeEventListener) this.#preference?.removeListener?.(this.#onPreference);
    this.#background = this.#glow = this.#observer = this.#preference = null;
    this.#particles = [];
    this.#canvas = this.#ctx = this.#view = null;
  }
}
