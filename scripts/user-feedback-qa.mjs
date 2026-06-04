import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/user-feedback");
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

  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
  fs.writeFileSync(path.join(outDir, "new-player-save.json"), JSON.stringify(saved, null, 2));
  const expectedStarter = { surge: 1, freeze: 1, burst: 1, prism: 0 };
  for (const [id, count] of Object.entries(expectedStarter)) {
    if ((saved.inventory?.[id] || 0) !== count) await fail(`expected starter ${id} count ${count}, got ${saved.inventory?.[id]}`);
  }
  if (saved.profileLevel !== 1 || saved.xp !== 0) await fail(`expected level 1 and XP 0, got ${JSON.stringify({ level: saved.profileLevel, xp: saved.xp })}`);

  await page.click(".profile-medal");
  await page.waitForSelector('.modal-panel[data-panel="profile"]');
  const profileText = await page.locator(".modal-body").innerText();
  if (!/升级说明/.test(profileText) || !/经验满后自动升级/.test(profileText)) {
    await fail(`profile panel should explain leveling clearly: ${profileText}`);
  }
  await screenshot("profile-level-help");
  await page.click('button[aria-label="Close panel"]');

  await page.click(".play-button");
  await page.waitForSelector("canvas");
  await step(400);
  const initial = await state("game-initial");

  if (initial.rules?.timeLimit !== false || initial.timer !== null) await fail(`game should run without a level time limit: ${JSON.stringify(initial.rules)}`);
  if ((await page.locator(".shot-readout").count()) !== 0) await fail("current-shot side prompt should be removed");
  if ((await page.locator(".next-shot-preview").count()) !== 0) await fail("next-shot side prompt should be removed");
  if (!initial.shooter?.launcherPreview || initial.shooter.launcherPreview.nextRadiusRatio < 0.7) {
    await fail(`launcher should show a prominent next marble preview: ${JSON.stringify(initial.shooter?.launcherPreview)}`);
  }
  await screenshot("launcher-next-preview");

  const sfxProfile = initial.audio.sfxProfile;
  if (!sfxProfile || sfxProfile.audibleLevel < 0.9) await fail(`SFX profile should expose an audible level >= 0.9: ${JSON.stringify(sfxProfile)}`);
  for (const action of ["shoot", "hit", "explosion", "match", "join-impact", "freeze", "roll"]) {
    if (!sfxProfile.actions?.includes(action)) await fail(`SFX profile missing action "${action}": ${JSON.stringify(sfxProfile)}`);
  }

  await page.evaluate(() => window.forceSpecialMarble?.("bomb"));
  const target = initial.chain.visible[0];
  const rect = await page.locator("canvas").boundingBox();
  await page.mouse.click(rect.x + target.x, rect.y + target.y);
  await step(900);
  const afterBomb = await state("after-bomb-shot");
  const counts = afterBomb.audio.eventCounts || {};
  for (const action of ["shoot", "hit", "explosion", "special-bomb"]) {
    if (!counts[action]) await fail(`expected ${action} SFX event after bomb shot, got ${JSON.stringify(counts)}`);
  }

  await page.evaluate(async () => {
    window.debugSetTimer?.(0.02);
    if (typeof window.advanceTime === "function") await window.advanceTime(900);
  });
  const timerState = await state("timer-debug-ignored-state");
  if (timerState.mode !== "playing" || timerState.progress.finishReason === "timer") await fail(`debug timer should not end a no-limit level: ${JSON.stringify(timerState.progress)}`);
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed" }, null, 2));
