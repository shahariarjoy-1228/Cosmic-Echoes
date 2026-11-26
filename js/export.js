import { renderCompositionOffline } from "./audio.js";
import { GLOBAL_EVENT_BUDGET } from "./recursion.js";

export const WAV_EXPORT_DEFAULTS = Object.freeze({
  sampleRate: 44100, channels: 2, bitsPerSample: 16, maxDuration: 64, mimeType: "audio/wav",
});

const HEADER_BYTES = 44;
const FRAME_BYTES = 4;
const DOWNLOAD_GRACE_MS = 2000;

export function floatToPcm16(sample) {
  if (!Number.isFinite(sample)) return 0;
  const value = Math.max(-1, Math.min(1, sample));
  const magnitude = Math.round(Math.abs(value) * (value < 0 ? 32768 : 32767));
  return value < 0 && magnitude ? -magnitude : magnitude;
}

export function validateAudioBuffer(buffer) {
  if (!buffer || typeof buffer.getChannelData !== "function" || buffer.numberOfChannels !== 2) {
    throw new TypeError("WAV encoding requires a stereo AudioBuffer.");
  }
  const { sampleRate, length: frameCount, duration } = buffer;
  if (!Number.isInteger(sampleRate) || sampleRate < 22050 || sampleRate > 48000 ||
      !Number.isSafeInteger(frameCount) || frameCount < 1 || frameCount > WAV_EXPORT_DEFAULTS.maxDuration * sampleRate ||
      !Number.isFinite(duration) || duration <= 0 || Math.abs(duration - frameCount / sampleRate) > 1 / sampleRate) {
    throw new RangeError("Invalid sample rate, frame count, or duration. WAV audio is limited to 64 seconds.");
  }
  const dataBytes = frameCount * FRAME_BYTES;
  const byteLength = HEADER_BYTES + dataBytes;
  if (!Number.isSafeInteger(byteLength) || byteLength - 8 > 0xffffffff) throw new RangeError("WAV exceeds RIFF size limits.");

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  if (!(left instanceof Float32Array) || !(right instanceof Float32Array) ||
      left.length !== frameCount || right.length !== frameCount) throw new TypeError("Invalid WAV channel data.");
  return { left, right, sampleRate, frameCount, dataBytes, byteLength };
}

export function encodeWavPCM16(buffer) {
  const { left, right, sampleRate, frameCount, dataBytes, byteLength } = validateAudioBuffer(buffer);
  let bytes;
  try { bytes = new ArrayBuffer(byteLength); }
  catch { throw new Error("Unable to allocate the WAV buffer. Try a shorter recording."); }

  const view = new DataView(bytes);
  function tag(offset, text) {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  }
  tag(0, "RIFF");
  view.setUint32(4, byteLength - 8, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * FRAME_BYTES, true);
  view.setUint16(32, FRAME_BYTES, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, dataBytes, true);

  let clippedSamples = 0;
  for (let i = 0, offset = HEADER_BYTES; i < frameCount; i += 1, offset += FRAME_BYTES) {
    const l = left[i];
    const r = right[i];
    if (!Number.isFinite(l) || !Number.isFinite(r)) throw new RangeError(`Non-finite audio sample in frame ${i}.`);
    if (Math.abs(l) > 1) clippedSamples += 1;
    if (Math.abs(r) > 1) clippedSamples += 1;
    view.setInt16(offset, floatToPcm16(l), true);
    view.setInt16(offset + 2, floatToPcm16(r), true);
  }
  return {
    bytes,
    metadata: { sampleRate, channels: 2, bitsPerSample: 16, frameCount, duration: frameCount / sampleRate,
      dataBytes, byteLength, clippedSamples, mimeType: WAV_EXPORT_DEFAULTS.mimeType },
  };
}

export function createExportFilename({ environment, sessionId, filename } = {}) {
  const clean = (value) => typeof value === "string"
    ? value.toLowerCase().replace(/\.wav$/i, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
    : "";
  const parts = [clean(environment), clean(sessionId)].filter(Boolean);
  const suffix = (clean(filename) || parts.join("-") || "composition").slice(0, 72).replace(/-+$/g, "");
  return `cosmic-echoes-${suffix}.wav`;
}

export function createWavBlob(buffer, naming) {
  const { bytes, metadata } = encodeWavPCM16(buffer);
  if (typeof Blob !== "function") throw new Error("This browser does not support WAV Blob creation.");
  const blob = new Blob([bytes], { type: metadata.mimeType });
  return Object.freeze({ blob, ...metadata, filename: createExportFilename(naming) });
}

function captureRecording(controller, filename) {
  if (typeof controller?.getCompositionSnapshot !== "function" ||
      typeof controller.getOfflineCompositionInput !== "function") throw new TypeError("Supply the recording controller.");
  const snapshot = controller.getCompositionSnapshot();
  if (!snapshot) throw new Error("Record a composition before preparing a WAV.");
  if (snapshot.endpoint === null) throw new Error("Stop the recording or let it finish before exporting.");
  if (!Number.isFinite(snapshot.endpoint) || snapshot.endpoint <= 0) throw new RangeError("The recording has no positive duration.");
  const input = controller.getOfflineCompositionInput();
  const composition = input?.composition;
  if (!composition || !input.config || typeof input.config !== "object" ||
      composition.duration !== snapshot.endpoint || composition.duration > 60 ||
      !Array.isArray(composition.notes) || composition.notes.length > GLOBAL_EVENT_BUDGET ||
      !Array.isArray(composition.ambient) || composition.ambient.length > 2) {
    throw new RangeError("The finalized recording has invalid or unsupported offline input.");
  }
  return {
    input: structuredClone(input),
    naming: { environment: snapshot.environment, sessionId: snapshot.sessionId, filename },
  };
}

function requestDownload(url, filename, document) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try { link.click(); }
  finally { link.remove(); }
}

export class WavExporter {
  #render;
  #state = "idle";
  #message = "No WAV prepared.";
  #busy = false;
  #result = null;
  #url = null;
  #urlTimer = null;

  constructor({ render = renderCompositionOffline } = {}) {
    if (typeof render !== "function") throw new TypeError("Supply an offline renderer function.");
    this.#render = render;
  }

  getStatus() { return { state: this.#state, message: this.#message, busy: this.#busy }; }
  getResult() { return this.#result; }

  #set(state, message) {
    this.#state = state;
    this.#message = message;
  }

  async prepare(controller, { filename } = {}) {
    if (this.#state === "disposed") throw new Error("The exporter is disposed.");
    if (this.#busy) throw new Error("An export is already running.");
    this.#busy = true;
    try {
      this.#set("validating", "Checking the finalized recording.");
      const { input, naming } = captureRecording(controller, filename);
      this.#result = null;
      this.#set("rendering", "Rendering recorded audio offline.");
      const buffer = await this.#render(input.composition, { ...input.config, sampleRate: WAV_EXPORT_DEFAULTS.sampleRate });
      if (this.#state === "cancelled" || this.#state === "disposed") return null;
      this.#set("encoding", "Encoding stereo PCM WAV.");
      if (buffer?.sampleRate !== WAV_EXPORT_DEFAULTS.sampleRate) throw new RangeError("Offline renderer returned the wrong sample rate.");
      this.#result = createWavBlob(buffer, naming);
      this.#set("ready", "WAV ready. Choose Download WAV to save it.");
      return this.#result;
    } catch (error) {
      if (this.#state === "cancelled" || this.#state === "disposed") return null;
      this.#set("error", error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.#busy = false;
      if (this.#state === "cancelled") this.#set("cancelled", "Export cancelled.");
    }
  }

  cancel() {
    if (!this.#busy || this.#state !== "rendering") return false;
    this.#set("cancelled", "Export cancelled. Waiting for the offline renderer to finish.");
    return true;
  }

  clear() {
    if (this.#state === "disposed") return;
    this.#result = null;
    if (this.#busy) this.cancel();
    else this.#set("idle", "No WAV prepared.");
  }

  download() {
    if (this.#state === "disposed" || !this.#result) throw new Error("Prepare a WAV before downloading.");
    const { document, URL } = globalThis;
    if (!document?.body || typeof URL?.createObjectURL !== "function" || typeof URL?.revokeObjectURL !== "function") {
      throw new Error("This browser does not support downloads from a WAV Blob.");
    }
    // Hold at most one leased URL across recent requests. The same WAV can be requested again.
    if (this.#url && this.#url.result !== this.#result) throw new Error("Wait briefly for the previous download request.");
    this.#url ??= { result: this.#result, value: URL.createObjectURL(this.#result.blob), revoke: URL.revokeObjectURL.bind(URL) };
    clearTimeout(this.#urlTimer);
    const lease = this.#url;
    this.#urlTimer = setTimeout(() => {
      lease.revoke(lease.value);
      this.#url = this.#urlTimer = null;
    }, DOWNLOAD_GRACE_MS);
    requestDownload(lease.value, this.#result.filename, document);
    this.#set(this.#state, "Download requested.");
  }

  dispose() {
    if (this.#state === "disposed") return;
    this.#result = null;
    this.#set("disposed", "Exporter disposed.");
    // A recent browser request keeps its lease until the grace timer revokes it.
  }
}
