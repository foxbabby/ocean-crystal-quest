import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/shot-audio-visual");
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

async function state(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) await fail(`missing render_game_to_text at ${label}`);
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") await window.advanceTime(advanceMs);
  }, ms);
}

async function screenshot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
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
  const musicToggle = page.locator('[data-audio-toggle="music"]');
  const sfxToggle = page.locator('[data-audio-toggle="sfx"]');
  if ((await musicToggle.count()) !== 1 || (await sfxToggle.count()) !== 1) {
    await fail("settings must expose separate music and SFX toggles");
  }
  await musicToggle.click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "null")?.musicEnabled === false, saveKey);
  let saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
  if (saved.sfxEnabled !== true) await fail(`turning music off should leave SFX on: ${JSON.stringify(saved)}`);
  await sfxToggle.click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "null")?.sfxEnabled === false, saveKey);
  saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
  if (saved.musicEnabled !== false) await fail(`turning SFX off should not turn music back on: ${JSON.stringify(saved)}`);
  await sfxToggle.click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "null")?.sfxEnabled === true, saveKey);
  await screenshot("settings-separate-audio-toggles");
  await page.click('button[aria-label="Close panel"]');

  await page.click(".play-button");
  await page.waitForSelector("canvas");
  await step(320);
  const initial = await state("game-initial");
  if (initial.shooter?.projectileSpeed < 1500) await fail(`projectile speed should feel fast, got ${initial.shooter?.projectileSpeed}`);
  if (initial.visuals?.marbleDimension !== "3d-sphere" || initial.visuals?.lightingModel !== "layered-specular") {
    await fail(`marbles should expose 3D visual metadata: ${JSON.stringify(initial.visuals)}`);
  }
  if (initial.audio?.controls?.musicEnabled !== false || initial.audio?.controls?.sfxEnabled !== true) {
    await fail(`audio controls should keep music off and SFX on independently: ${JSON.stringify(initial.audio)}`);
  }
  if (initial.audio.sfxProfile?.audibleLevel < 1.18 || initial.audio.sfxProfile?.gain < 1.15) {
    await fail(`SFX should be louder than before: ${JSON.stringify(initial.audio.sfxProfile)}`);
  }
  if (initial.audio.musicProfile?.enabled !== false) await fail(`music should be disabled independently: ${JSON.stringify(initial.audio.musicProfile)}`);
  await screenshot("game-fast-shot-3d-sfx");

  const hudMusic = page.locator('[data-hud-audio="music"]');
  const hudSfx = page.locator('[data-hud-audio="sfx"]');
  if ((await hudMusic.count()) !== 1 || (await hudSfx.count()) !== 1) await fail("game HUD must expose separate music and SFX controls");
  await hudMusic.click();
  await step(120);
  const afterMusicOn = await state("after-hud-music-on");
  if (afterMusicOn.audio.controls.musicEnabled !== true || afterMusicOn.audio.controls.sfxEnabled !== true) {
    await fail(`HUD music toggle should not change SFX: ${JSON.stringify(afterMusicOn.audio.controls)}`);
  }
  await hudSfx.click();
  await step(120);
  const afterSfxOff = await state("after-hud-sfx-off");
  if (afterSfxOff.audio.controls.musicEnabled !== true || afterSfxOff.audio.controls.sfxEnabled !== false) {
    await fail(`HUD SFX toggle should not change music: ${JSON.stringify(afterSfxOff.audio.controls)}`);
  }
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed" }, null, 2));
