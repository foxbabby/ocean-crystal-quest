import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/difficulty-physics");
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

async function clickCanvasAtGamePoint(point) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("canvas missing");
  await page.mouse.click(box.x + point.x, box.y + point.y);
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

const initial = await state("level-1-initial");
if (initial.progress.targetOrbs !== initial.level.targetOrbs || initial.progress.remainingOrbs <= 0) {
  throw new Error(`invalid all-clear target: ${JSON.stringify(initial.progress)}`);
}
if (initial.difficulty.entries !== 1 || initial.difficulty.exits !== 1) {
  throw new Error(`level 1 should use simple terrain: ${JSON.stringify(initial.difficulty)}`);
}

await page.click('button[aria-label="电光"]');
await step(260);
await page.click('button[aria-label="爆裂"]');
await step(260);
const afterPowerups = await state("after-starter-powerups");
if (afterPowerups.mode !== "playing" || afterPowerups.progress.remainingOrbs <= 0) {
  throw new Error(`level completed before all marbles cleared: ${JSON.stringify(afterPowerups.progress)}`);
}

const target = afterPowerups.chain.visible[Math.min(2, afterPowerups.chain.visible.length - 1)];
await clickCanvasAtGamePoint(target);
await step(900);
const afterImpact = await state("after-impact");
if (afterImpact.physics.impactCount < 1 || afterImpact.physics.lastImpactKnockback <= 0) {
  throw new Error(`missing physical collision recoil: ${JSON.stringify(afterImpact.physics)}`);
}

const beforeSpeed = afterImpact.difficulty.speedMultiplier;
await step(3200);
const afterSpeed = await state("after-acceleration");
if (afterSpeed.difficulty.speedMultiplier <= beforeSpeed) {
  throw new Error(`speed did not increase over time: before ${beforeSpeed}, after ${afterSpeed.difficulty.speedMultiplier}`);
}

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), saveKey);
await page.evaluate((key) => {
  const save = JSON.parse(localStorage.getItem(key));
  for (const levelId of Object.keys(save.levels)) save.levels[levelId].unlocked = true;
  save.selectedScene = "neon";
  save.selectedLevelId = "neon-4";
  save.inventory = { ...save.inventory, surge: 4, freeze: 4, burst: 4, prism: 4 };
  localStorage.setItem(key, JSON.stringify(save));
}, saveKey);
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".select-screen");
await page.click(".play-button");
await page.waitForSelector("canvas");
await step(240);
const lateLevel = await state("neon-4-terrain");
if (lateLevel.level.id !== "neon-4") throw new Error(`expected neon-4, got ${lateLevel.level.id}`);
if (lateLevel.difficulty.entries < 3 || lateLevel.difficulty.exits < 3 || lateLevel.difficulty.branchCount < 2) {
  throw new Error(`late level should expose multiple entrances/exits/branches: ${JSON.stringify(lateLevel.difficulty)}`);
}
await page.screenshot({ path: path.join(outDir, "neon-4-multivent.png"), fullPage: true });

fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();

if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed", impactKnockback: afterImpact.physics.lastImpactKnockback, lateLevel: lateLevel.difficulty }, null, 2));
