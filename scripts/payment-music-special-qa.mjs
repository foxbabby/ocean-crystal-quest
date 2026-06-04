import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/payment-music-special");
const saveKey = "ocean-crystal-quest-save-v4";
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const failures = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));

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
  const downloadedOptions = await page.locator('.music-option[data-source="downloaded"]').count();
  if (downloadedOptions < 3) await fail(`expected 3 downloaded music tracks, got ${downloadedOptions}`);
  await page.locator('.music-option[data-track="ocean-light"]').click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "null")?.musicTrack === "ocean-light", saveKey);
  await screenshot("settings-downloaded-music");
  await page.click('button[aria-label="Close panel"]');

  await page.locator(".select-currencies .stat-pill").first().click();
  await page.waitForSelector('.modal-panel[data-panel="wallet"]');
  await page.click(".panel-action-button.primary");
  await page.waitForSelector('.modal-panel[data-panel="shop"]');
  const beforeInventory = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).inventory.surge, saveKey);
  await page.click('[data-shop-powerup="surge"]');
  await page.waitForSelector(".payment-panel");
  const afterClickInventory = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).inventory.surge, saveKey);
  if (afterClickInventory !== beforeInventory) {
    await fail(`inventory changed before payment confirmation: before ${beforeInventory}, after ${afterClickInventory}`);
  }
  const paymentText = await page.locator(".payment-panel").innerText();
  if (!/¥1|1元|RMB 1/i.test(paymentText)) await fail(`payment panel should show 1 yuan price, got: ${paymentText}`);
  const qrCount = await page.locator('img[alt*="微信收款二维码"], img[src*="wechat-pay"]').count();
  if (qrCount !== 1) await fail(`expected one WeChat payment QR image, got ${qrCount}`);
  await screenshot("payment-panel-before-confirm");
  await page.click("[data-confirm-paid]");
  await page.waitForFunction(
    ({ key, before }) => JSON.parse(localStorage.getItem(key) || "null")?.inventory?.surge === before + 1,
    { key: saveKey, before: beforeInventory },
  );
  await screenshot("payment-confirmed-shop");
  await page.click('button[aria-label="Close panel"]');

  await page.click(".play-button");
  await page.waitForSelector("canvas");
  await page.evaluate(async () => {
    if (typeof window.advanceTime === "function") await window.advanceTime(320);
  });
  const initial = await state("game-initial");
  if (!initial.audio.musicProfile?.usesDownloadedAudio || initial.audio.musicProfile?.audibleLevel < 0.75) {
    await fail(`game should use audible downloaded music: ${JSON.stringify(initial.audio.musicProfile)}`);
  }
  if (!initial.audio.musicProfile?.audioPath?.includes("/audio/")) {
    await fail(`music profile should expose audio file path: ${JSON.stringify(initial.audio.musicProfile)}`);
  }
  if (initial.audio.musicProfile?.format !== "mp3" || !initial.audio.musicProfile?.mobileOptimized) {
    await fail(`music should expose mobile mp3 metadata: ${JSON.stringify(initial.audio.musicProfile)}`);
  }
  if (!initial.difficulty?.currentSpeed || !initial.difficulty?.speedLabel) {
    await fail(`game state should expose current speed display data: ${JSON.stringify(initial.difficulty)}`);
  }
  await page.waitForSelector(".speed-readout");
  const speedText = await page.locator(".speed-readout").innerText();
  if (!/速度|Speed/.test(speedText)) await fail(`speed readout missing label: ${speedText}`);

  const guideText = await page.locator(".special-marble-guide").innerText();
  if (!/彩色弹珠|Rainbow/.test(guideText) || !/炸弹弹珠|Bomb/.test(guideText) || !/贯穿|pierce/i.test(guideText)) {
    await fail(`special marble guide missing expected descriptions: ${guideText}`);
  }
  const special = initial.specialMarbles;
  if (!special?.definitions?.rainbow || !special?.definitions?.bomb) {
    await fail(`render state should expose special marble definitions: ${JSON.stringify(special)}`);
  }
  if (special.spawnChance > 0.14) {
    await fail(`special marble chance should stay low, got ${special.spawnChance}`);
  }

  await page.evaluate(async () => {
    window.forceSpecialMarble?.("rainbow");
    if (typeof window.advanceTime === "function") await window.advanceTime(50);
  });
  const forced = await state("forced-rainbow");
  if (forced.shooter?.currentShot?.special !== "rainbow") {
    await fail(`debug-forced current shot should be rainbow: ${JSON.stringify(forced.shooter)}`);
  }
  await screenshot("game-speed-special-guide");
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed" }, null, 2));
