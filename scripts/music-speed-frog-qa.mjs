import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/music-speed-frog");
const saveKey = "ocean-crystal-quest-save-v4";
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") await window.advanceTime(advanceMs);
  }, ms);
}

async function state(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) throw new Error(`missing render_game_to_text at ${label}`);
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

await page.setViewportSize({ width: 1440, height: 1024 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.evaluate((key) => {
  localStorage.removeItem("ocean-crystal-quest-save-v3");
  localStorage.removeItem(key);
}, saveKey);
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".select-screen");

await page.click('button[aria-label="Settings"]');
await page.waitForSelector('.modal-panel[data-panel="settings"]');
const musicOptions = await page.locator(".music-option").count();
if (musicOptions < 3) throw new Error(`expected at least 3 selectable background music options, got ${musicOptions}`);
await page.locator(".music-option").nth(1).click();
await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "null")?.musicTrack === "mystic-light", saveKey);
await page.locator(".modal-close").click();

await page.click(".play-button");
await page.waitForSelector("canvas");
await step(260);
const initial = await state("initial");
if (initial.toad?.kind !== "golden-toad" || initial.toad?.form !== "frog" || initial.toad?.hasWebbedFeet !== true) {
  throw new Error(`golden toad should read as a frog: ${JSON.stringify(initial.toad)}`);
}
if (
  initial.audio.musicProfile?.selectedTrack !== "mystic-light" ||
  initial.audio.musicProfile?.continuousLoop !== true ||
  initial.audio.musicProfile?.audibleLevel < 0.75 ||
  initial.audio.musicProfile?.usesDownloadedAudio !== true
) {
  throw new Error(`background music should be selectable, audible, and looping: ${JSON.stringify(initial.audio.musicProfile)}`);
}

const beforeSpeed = initial.difficulty.speedMultiplier;
const beforeMusicLoops = initial.audio.eventCounts?.["music-loop"] || 0;
await step(12000);
const later = await state("after-12s");
const afterMusicLoops = later.audio.eventCounts?.["music-loop"] || 0;
if (afterMusicLoops <= beforeMusicLoops) {
  throw new Error(`background music should keep looping after gameplay starts: ${JSON.stringify(later.audio.eventCounts)}`);
}
if (later.difficulty.speedMultiplier < beforeSpeed + 0.32) {
  throw new Error(`speed should ramp up clearly over time: before ${beforeSpeed}, after ${later.difficulty.speedMultiplier}`);
}

await page.screenshot({ path: path.join(outDir, "frog-music-speed.png"), fullPage: true });
fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();

if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      result: "passed",
      musicProfile: later.audio.musicProfile,
      speed: { before: beforeSpeed, after: later.difficulty.speedMultiplier },
      toad: later.toad,
    },
    null,
    2,
  ),
);
