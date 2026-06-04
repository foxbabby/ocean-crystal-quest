import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/game-flow");
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));
const saveKey = "ocean-crystal-quest-save-v4";

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") await window.advanceTime(advanceMs);
  }, ms);
}

async function gameState(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) throw new Error(`missing render_game_to_text at ${label}`);
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

async function screenshot(label) {
  await page.screenshot({ path: path.join(outDir, `${label}.png`), fullPage: true });
}

await page.setViewportSize({ width: 1440, height: 1024 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.removeItem("ocean-crystal-quest-save-v3");
  localStorage.removeItem("ocean-crystal-quest-save-v4");
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".select-screen");
await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), saveKey);
await page.evaluate((key) => {
  const save = JSON.parse(localStorage.getItem(key));
  save.inventory = { ...save.inventory, surge: 12, freeze: 4, burst: 12, prism: 12 };
  localStorage.setItem(key, JSON.stringify(save));
}, saveKey);
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".select-screen");

const level2 = page.locator('button[aria-label="Glass Reef level 2"]');
if (!(await level2.isDisabled())) {
  throw new Error("level 2 should be locked before clearing level 1");
}

await screenshot("select-before-clear");
await page.click(".play-button");
await page.waitForSelector("canvas");
await step(300);
await gameState("level-1-start");

for (let index = 0; index < 10; index += 1) {
  for (const label of ["电光", "爆裂", "棱镜"]) {
    if (await page.locator(".result-overlay").isVisible().catch(() => false)) break;
    await page.click(`button[aria-label="${label}"]`);
    await step(220);
  }
}
await page.waitForSelector(".result-overlay", { state: "visible", timeout: 3000 });
await screenshot("level-1-result");

const completed = await gameState("level-1-complete");
if (completed.mode !== "complete" || completed.progress.remainingOrbs !== 0) {
  throw new Error(`level did not complete: ${JSON.stringify(completed.progress)}`);
}

const savedAfterClear = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
fs.writeFileSync(path.join(outDir, "save-after-clear.json"), JSON.stringify(savedAfterClear, null, 2));
if (!savedAfterClear.levels["crystal-1"].completed) throw new Error("crystal-1 not marked completed");
if (!savedAfterClear.levels["crystal-2"].unlocked) throw new Error("crystal-2 not unlocked");
if (savedAfterClear.profileLevel < 1) throw new Error("profile level regressed");
if (savedAfterClear.coins <= 0) throw new Error("coins reward not applied");
if ((savedAfterClear.inventory.freeze || 0) <= 1) throw new Error("first clear power-up reward not applied");

await page.click(".result-actions .panel-action-button.primary");
await page.waitForTimeout(500);
const next = await gameState("level-2-start");
if (next.level.id !== "crystal-2") throw new Error(`next level did not start: ${next.level.id}`);
await screenshot("level-2-start");

fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify(errors, null, 2));
await browser.close();

if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed", cleared: "crystal-1", unlocked: "crystal-2" }, null, 2));
