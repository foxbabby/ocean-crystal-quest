import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/golden-audio-layout");
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

async function layout(label) {
  const result = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { width: Math.round(box.width), height: Math.round(box.height), top: Math.round(box.top), bottom: Math.round(box.bottom) };
    };
    return {
      viewportHeight: window.innerHeight,
      docScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      gameScreen: rect(".game-screen"),
      gameLayout: rect(".game-layout"),
      gameStage: rect(".game-stage"),
      canvas: rect("canvas"),
    };
  });
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(result, null, 2));
  return result;
}

await page.setViewportSize({ width: 1440, height: 1024 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.removeItem("ocean-crystal-quest-save-v3");
  localStorage.removeItem("ocean-crystal-quest-save-v4");
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".select-screen");
await page.click(".play-button");
await page.waitForSelector("canvas");
await step(240);

const initial = await state("initial");
if (initial.toad?.kind !== "golden-toad" || initial.toad?.material !== "gold") {
  throw new Error(`exit monster should be a golden toad: ${JSON.stringify(initial.toad)}`);
}
if (
  initial.audio.musicProfile?.lowRumble !== false ||
  initial.audio.musicProfile?.noiseFree !== true ||
  initial.audio.musicProfile?.backgroundMode !== "scene-loop" ||
  initial.audio.musicProfile?.continuousLoop !== true ||
  initial.audio.musicProfile?.audibleLevel < 0.42
) {
  throw new Error(`background music should be audible, looping, and noise-free: ${JSON.stringify(initial.audio.musicProfile)}`);
}

const samples = [];
samples.push(await layout("layout-0"));
for (let i = 1; i <= 8; i += 1) {
  await step(420);
  samples.push(await layout(`layout-${i}`));
}

const heights = samples.map((sample) => sample.docScrollHeight);
const stageHeights = samples.map((sample) => sample.gameStage.height);
const growth = Math.max(...heights) - heights[0];
const stageGrowth = Math.max(...stageHeights) - stageHeights[0];
if (growth > 2 || stageGrowth > 2) {
  throw new Error(`game page height should not gradually grow: ${JSON.stringify({ heights, stageHeights, growth, stageGrowth })}`);
}

await page.screenshot({ path: path.join(outDir, "golden-toad-gameplay.png"), fullPage: true });
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
      musicProfile: initial.audio.musicProfile,
      toad: initial.toad,
      layout: { heights, stageHeights, growth, stageGrowth },
    },
    null,
    2,
  ),
);
