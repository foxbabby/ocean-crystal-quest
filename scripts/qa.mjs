import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/qa");
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));

async function saveState(name) {
  const state = await page.evaluate(() => {
    if (typeof window.render_game_to_text !== "function") return null;
    return window.render_game_to_text();
  });
  if (state) fs.writeFileSync(path.join(outDir, `${name}.json`), state);
}

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") {
      await window.advanceTime(advanceMs);
    }
  }, ms);
}

async function clickCanvas(xRatio, yRatio) {
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) throw new Error("canvas not found");
  await page.mouse.click(canvas.x + canvas.width * xRatio, canvas.y + canvas.height * yRatio);
}

await page.setViewportSize({ width: 1440, height: 1024 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "desktop-select-crystal.png"), fullPage: true });
await page.click(".scene-card[data-scene='neon']");
await page.screenshot({ path: path.join(outDir, "desktop-select-neon.png"), fullPage: true });
await page.click(".play-button");
await page.waitForSelector("canvas");
await clickCanvas(0.68, 0.34);
await step(900);
await clickCanvas(0.54, 0.28);
await step(1200);
await page.screenshot({ path: path.join(outDir, "desktop-game-neon.png"), fullPage: true });
await saveState("desktop-game-neon-state");

await page.click("button[aria-label='Back to scene select']");
await page.click(".scene-card[data-scene='abyssal']");
await page.click(".play-button");
await page.waitForSelector("canvas");
await step(600);
await page.screenshot({ path: path.join(outDir, "desktop-game-abyssal.png"), fullPage: true });
await saveState("desktop-game-abyssal-state");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.click(".scene-card[data-scene='neon']");
await page.screenshot({ path: path.join(outDir, "mobile-select-neon.png"), fullPage: true });
await page.click(".play-button");
await page.waitForSelector("canvas");
await clickCanvas(0.52, 0.32);
await step(1000);
await page.screenshot({ path: path.join(outDir, "mobile-game-neon.png"), fullPage: true });
await saveState("mobile-game-neon-state");

fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();

if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
