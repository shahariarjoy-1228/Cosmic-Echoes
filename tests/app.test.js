const frame = document.getElementById("app-frame");
const results = document.getElementById("results");
const summary = document.getElementById("summary");
let passed = 0;
let failed = 0;
let skipped = 0;

const wait = (ms = 25) => new Promise(resolve => setTimeout(resolve, ms));
const doc = () => frame.contentDocument;
const win = () => frame.contentWindow;
const get = id => doc().getElementById(id);
const status = () => get("session-state").textContent;
const click = id => get(id).click();
const change = (id, value, type = "input") => {
  get(id).value = value;
  get(id).dispatchEvent(new (win().Event)(type, { bubbles: true }));
};

function assert(value, message = "Unexpected result") {
  if (!value) throw new Error(message);
}

async function until(predicate, message) {
  for (let i = 0; i < 200; i += 1) {
    if (predicate()) return;
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
  const item = document.createElement("li");
  skipped += 1;
  item.textContent = `SKIP: ${name}`;
  results.append(item);
}

const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
frame.src = "../index.html";
await loaded;
await test("Root loads silently with actual defaults and export unavailable", async () => {
  await until(() => get("start") && !get("start").disabled, "Application did not initialize");
  get("diagnostics-panel").open = true;
  await until(() => get("diagnostics").textContent.includes("Audio uninitialized"), "Expected no AudioContext on load");
  assert(doc().title === "Cosmic Echoes" && status() === "Idle");
  assert(get("environment").options.length === 3 && get("environment").value === "deep-space");
  assert(get("maxDepth").value === "3" && get("childrenPerStar").value === "2" && get("tempo").value === "55");
  assert(get("decay").value === "0.65" && get("spreadAngle").value === "100" && get("generationDelay").value === "0.8");
  assert(get("prepare").disabled && get("download").disabled && get("replay").disabled && get("center").disabled);
  assert(!get("onboarding").hidden && get("error").hidden);
});

await test("Semantic controls, labels, focus, and help are available", () => {
  assert(doc().querySelector("header + main") && doc().querySelector("main aside"), "Missing page landmarks");
  for (const input of doc().querySelectorAll("input, select")) {
    assert(input.labels.length > 0, `Missing label for ${input.id}`);
  }
  for (const button of doc().querySelectorAll("button")) assert(button.textContent.trim());
  assert(get("sky").getAttribute("aria-label"));
  assert(get("notice").getAttribute("role") === "status" && get("error").getAttribute("role") === "alert");
  assert(get("export-status").getAttribute("role") === "status");
  get("start").focus();
  assert(doc().activeElement === get("start"), "Start is not focusable");
  const rules = [...doc().styleSheets[0].cssRules];
  assert(rules.some(rule => rule.selectorText === ":focus-visible" && rule.style.getPropertyValue("outline").includes("solid")), "Missing visible focus rule");
  doc().querySelector(".help-link").click();
  assert(doc().querySelector("#about details").open, "Help link did not open the details");
});

await test("Responsive widths fit without overflow and keep a usable canvas", async () => {
  frame.style.maxWidth = "none";
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    frame.style.width = `${width}px`;
    await until(() => frame.contentWindow.innerWidth === width, `Viewport did not reach ${width}`);
    await wait(90);
    const viewport = doc().documentElement.clientWidth;
    assert(doc().documentElement.scrollWidth <= viewport + 1, `Overflow at ${width}`);
    const rect = get("sky").getBoundingClientRect();
    const playback = get("start").getBoundingClientRect();
    assert(rect.width > 200 && rect.height > 200 && playback.width > 30, `Small controls at ${width}`);
  }
  frame.style.width = "100%";
});

await test("Theme selection, reduced motion and recursion preview update through the UI", async () => {
  for (const [id, note] of [["nebula-dreams","A minor"], ["solar-harmony","F major"], ["deep-space","C major"]]) {
    change("environment", id, "change");
    assert(doc().documentElement.dataset.theme === id);
    assert(get("environment-description").textContent.includes(note));
  }
  change("motion", "reduced", "change");
  assert(get("diagnostics").textContent.includes("Reduced motion"));
  change("motion", "auto", "change");
  change("maxDepth", "4");
  change("childrenPerStar", "3");
  assert(get("recursion-preview").textContent.includes("121 stars") && get("maxDepth-value").textContent === "4");
  change("maxDepth", "3");
  change("childrenPerStar", "2");
});

function pointer(event, x, y, pointerType = "mouse") {
  get("sky").dispatchEvent(new (win().PointerEvent)(event, {
    pointerId: 11, pointerType, isPrimary: true, button: 0, clientX: x, clientY: y,
  }));
}

if (new URLSearchParams(location.search).get("live") !== "1") {
  skip("Real playback and export use the headless autoplay override or an equivalent browser policy");
} else {
  await test("Real session, single-action pointer and accessible placement run the existing engines", async () => {
    change("volume", "0");
    click("start");
    await until(() => status() === "Recording", "Session did not start");
    assert(get("environment").disabled && !get("pause").disabled && get("prepare").disabled);
    const rect = get("sky").getBoundingClientRect();
    const x = rect.left + rect.width * 0.3;
    const y = rect.top + rect.height * 0.5;
    pointer("pointerup", x, y);
    assert(get("recording").textContent.includes("0 stars"));
    pointer("pointerdown", x, y, "touch");
    pointer("pointermove", x + 35, y, "touch");
    pointer("pointerup", x + 35, y, "touch");
    assert(get("recording").textContent.includes("0 stars"));
    pointer("pointerdown", x, y);
    pointer("pointerup", x, y);
    assert(get("notice").textContent.includes("15 celestial") && get("recording").textContent.includes("15 stars"));
    change("maxDepth", "0");
    click("center");
    assert(get("recording").textContent.includes("16 stars"));
    get("placement").requestSubmit();
    assert(get("recording").textContent.includes("17 stars"));
    await until(() => /Active [1-9].*Voices [1-9]/.test(get("diagnostics").textContent), "Expected live visuals and admitted voices");
    click("pause");
    await until(() => status() === "Paused", "Pause did not complete");
    const paused = get("playhead").value;
    await wait(230);
    assert(get("playhead").value === paused && get("center").disabled);
    click("resume");
    await until(() => status() === "Recording" && get("playhead").value > paused, "Resume did not continue");
    click("stop");
    await until(() => status() === "Stopped" && !get("prepare").disabled, "Stop did not finalize");
    assert(get("recording").textContent.includes("17 recorded stars") && !get("replay").disabled);
    assert(get("error").hidden);
  });

  await test("Export cancellation and renderer errors preserve the finalized recording", async () => {
    const label = get("recording").textContent;
    const prototype = win().OfflineAudioContext.prototype;
    const original = prototype.startRendering;
    let release;
    try {
      prototype.startRendering = function () {
        const render = original.call(this);
        return new Promise((resolve, reject) => {
          release = () => render.then(resolve, reject);
        });
      };
      click("prepare");
      await until(() => !get("cancel").disabled, "Cancellation did not become available");
      assert(get("prepare").disabled);
      click("cancel");
      assert(get("prepare").disabled && get("download").disabled);
      release();
      await until(() => !get("prepare").disabled, "Cancelled render did not settle");
      assert(get("export-status").textContent.includes("cancelled") && get("wav-metadata").hidden);
      prototype.startRendering = () => Promise.reject(new Error("Controlled render failure"));
      click("prepare");
      await until(() => !get("export-error").hidden, "Expected a readable rendering error");
      assert(get("export-error").textContent.includes("Controlled render failure"));
      assert(get("recording").textContent === label && !get("replay").disabled);
    } finally {
      release?.();
      prototype.startRendering = original;
    }
  });

  await test("Real WAV preparation, download request and replay preserve the recording", async () => {
    const label = get("recording").textContent;
    click("prepare");
    await until(() => !get("download").disabled, "WAV not ready");
    assert(get("wav-metadata").textContent.includes("44.1 kHz · Stereo · 16-bit PCM"));
    const browser = win();
    const originalCreate = browser.URL.createObjectURL;
    const originalClick = browser.HTMLAnchorElement.prototype.click;
    let capture;
    let requested = "";
    try {
      browser.URL.createObjectURL = blob => { capture = blob; return originalCreate.call(browser.URL, blob); };
      browser.HTMLAnchorElement.prototype.click = function () { requested = this.download; };
      click("download");
      assert(capture && capture.type === "audio/wav" && requested.endsWith(".wav"));
      const view = new DataView(await capture.arrayBuffer());
      assert(view.getUint32(0) === 0x52494646 && view.getUint32(4, true) + 8 === capture.size);
      assert(view.getUint16(22, true) === 2 && view.getUint32(24, true) === 44100 && view.getUint16(34, true) === 16);
      assert(get("export-status").textContent === "Download requested.");
    } finally {
      browser.URL.createObjectURL = originalCreate;
      browser.HTMLAnchorElement.prototype.click = originalClick;
    }
    assert(get("recording").textContent === label);
    click("replay");
    await until(() => status() === "Replaying", "Replay did not start");
    click("stop");
    await until(() => status() === "Stopped", "Replay did not stop");
    assert(get("recording").textContent === label);
    click("start");
    await until(() => status() === "Recording", "Second session did not start");
    assert(get("download").disabled && get("wav-metadata").hidden);
    click("reset");
    await until(() => status() === "Idle", "Reset did not restore idle");
    assert(get("prepare").disabled && get("replay").disabled);
  });
}

summary.textContent = `${passed} passed, ${failed} failed, ${skipped} skipped (${passed + failed + skipped} total).`;
