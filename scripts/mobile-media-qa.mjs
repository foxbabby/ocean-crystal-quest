import fs from "node:fs";
import path from "node:path";
import { chromium, devices } from "playwright";

const outDir = path.resolve("output/mobile-media");
const saveKey = "ocean-crystal-quest-save-v4";
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const failures = [];
const responses = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices["iPhone 14"],
  locale: "zh-CN",
});
const page = await context.newPage();

page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));
page.on("response", (response) => {
  const url = response.url();
  if (/\.(webp|png|jpe?g|mp3|ogg|wav)(\?|$)/i.test(url)) {
    responses.push({
      url,
      status: response.status(),
      contentType: response.headers()["content-type"] || "",
    });
  }
});

async function fail(message) {
  failures.push(message);
  throw new Error(message);
}

async function screenshot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function state(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) await fail(`missing render_game_to_text at ${label}`);
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

try {
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    localStorage.removeItem("ocean-crystal-quest-save-v3");
    localStorage.removeItem(key);
  }, saveKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".select-screen");

  const sceneImages = await page.locator(".scene-frame img").evaluateAll((images) =>
    images.map((image) => ({
      src: image.getAttribute("src"),
      currentSrc: image.currentSrc,
      loading: image.getAttribute("loading"),
      naturalWidth: image.naturalWidth,
    })),
  );
  if (sceneImages.length !== 3) await fail(`expected three scene images, got ${sceneImages.length}`);
  if (sceneImages.some((image) => !/\.webp($|\?)/i.test(image.currentSrc || image.src || ""))) {
    await fail(`scene cards should use optimized webp images: ${JSON.stringify(sceneImages)}`);
  }
  if (sceneImages.some((image) => image.naturalWidth > 900)) {
    await fail(`scene card image should be mobile-sized, got: ${JSON.stringify(sceneImages)}`);
  }

  const resourceNames = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  const heavyPngLoads = resourceNames.filter((name) => /assets\/reference\/|preview.*\.png|scene-select.*\.png/i.test(name));
  if (heavyPngLoads.length) await fail(`mobile page loaded old heavy png assets: ${heavyPngLoads.join(", ")}`);

  await screenshot("mobile-scene-select");
  await page.click(".play-button");
  await page.waitForSelector("canvas");
  await page.evaluate(async () => {
    if (typeof window.advanceTime === "function") await window.advanceTime(700);
  });
  const initial = await state("mobile-game-initial");
  const musicProfile = initial.audio?.musicProfile || {};
  if (!musicProfile.mobileOptimized || musicProfile.format !== "mp3") {
    await fail(`music should use mobile-optimized mp3: ${JSON.stringify(musicProfile)}`);
  }
  if (!/\/audio\/mobile\/.+\.mp3/i.test(musicProfile.resolvedAudioPath || musicProfile.audioPath || "")) {
    await fail(`music path should point to audio/mobile mp3: ${JSON.stringify(musicProfile)}`);
  }
  if (musicProfile.lastPlayError) {
    await fail(`music playback reported an error: ${JSON.stringify(musicProfile)}`);
  }
  if (musicProfile.playbackState === "blocked") {
    await fail(`music playback is blocked after tapped start: ${JSON.stringify(musicProfile)}`);
  }

  const audioCheck = await page.evaluate(async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      byteLength: buffer.byteLength,
    };
  }, musicProfile.resolvedAudioPath || musicProfile.audioPath);
  if (audioCheck.status !== 200 || !/audio\/(mpeg|mp3)/i.test(audioCheck.contentType || "")) {
    await fail(`music file should load as mp3 over HTTP 200: ${JSON.stringify(audioCheck)}`);
  }
  if (audioCheck.byteLength > 900_000) {
    await fail(`default music file should stay lightweight for mobile, got ${audioCheck.byteLength} bytes`);
  }
  await screenshot("mobile-game-audio");
} finally {
  fs.writeFileSync(path.join(outDir, "responses.json"), JSON.stringify({ responses, errors, failures }, null, 2));
  await context.close();
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed" }, null, 2));
