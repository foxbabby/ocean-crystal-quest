import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/color-stability");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

async function state(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) throw new Error(`missing render_game_to_text at ${label}`);
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") await window.advanceTime(advanceMs);
  }, ms);
}

async function clickCanvas(xRatio, yRatio) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("canvas missing");
  await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * yRatio);
}

await page.setViewportSize({ width: 1440, height: 1024 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.click(".play-button");
await page.waitForSelector("canvas");

const seen = new Map();
const record = (snapshot, label) => {
  for (const ball of snapshot.chain.visible) {
    if (!ball.id) {
      throw new Error(`visible ball at index ${ball.index} is missing stable id in ${label}`);
    }
    const prior = seen.get(ball.id);
    if (prior && prior.color !== ball.color) {
      throw new Error(`ball ${ball.id} changed color from ${prior.color} to ${ball.color} in ${label}`);
    }
    seen.set(ball.id, { color: ball.color, label });
  }
};

record(await state("initial"), "initial");
for (const [index, aim] of [
  [1, [0.62, 0.34]],
  [2, [0.72, 0.26]],
  [3, [0.48, 0.33]],
  [4, [0.56, 0.22]],
]) {
  await clickCanvas(aim[0], aim[1]);
  await step(1100);
  const snapshot = await state(`after-shot-${index}`);
  record(snapshot, `after-shot-${index}`);
}

await page.screenshot({ path: path.join(outDir, "final.png"), fullPage: true });
await browser.close();

if (errors.length) {
  throw new Error(`console errors: ${errors.join("; ")}`);
}

console.log(JSON.stringify({ stableBallIdsTracked: seen.size }, null, 2));
