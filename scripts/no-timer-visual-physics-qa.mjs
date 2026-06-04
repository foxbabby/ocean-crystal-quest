import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/no-timer-visual-physics");
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

async function startFreshGame(label = "game") {
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.evaluate((key) => {
    localStorage.removeItem("ocean-crystal-quest-save-v3");
    localStorage.removeItem(key);
  }, saveKey);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".select-screen");
  await page.click(".play-button");
  await page.waitForSelector("canvas");
  await step(500);
  return state(label);
}

try {
  await page.setViewportSize({ width: 1440, height: 1024 });
  const initial = await startFreshGame("initial");

  if (initial.rules?.timeLimit !== false) await fail(`expected no time limit rule, got ${JSON.stringify(initial.rules)}`);
  if (initial.timer !== null || initial.progress?.remainingTime !== null) await fail(`timer should be null in no-limit mode: ${JSON.stringify({ timer: initial.timer, progress: initial.progress })}`);
  const hudText = await page.locator(".game-hud").innerText();
  if (/\d+s|时间|Time/.test(hudText)) await fail(`HUD should not show a countdown timer: ${hudText}`);
  await page.evaluate(async () => {
    window.debugSetTimer?.(0.01);
    if (typeof window.advanceTime === "function") await window.advanceTime(1200);
  });
  const afterTimerAttempt = await state("after-debug-timer-attempt");
  if (afterTimerAttempt.mode !== "playing" || afterTimerAttempt.progress?.finishReason === "timer") {
    await fail(`timer debug should not be able to end a no-limit level: ${JSON.stringify(afterTimerAttempt.progress)}`);
  }

  if ((await page.locator(".shot-readout").count()) !== 0) await fail("current-shot side prompt should be removed from the page UI");
  if ((await page.locator(".next-shot-preview").count()) !== 0) await fail("next-shot side prompt should be removed from the page UI");
  if (!initial.shooter?.launcherPreview || initial.shooter.launcherPreview.nextRadiusRatio < 0.7) {
    await fail(`launcher next marble should be prominent beside the shooter: ${JSON.stringify(initial.shooter?.launcherPreview)}`);
  }

  const visuals = initial.visuals || {};
  if (visuals.portalLabels !== false || visuals.exitStyle !== "dark-hole") await fail(`ports should be unlabeled holes: ${JSON.stringify(visuals)}`);
  if (visuals.marbleMaterial !== "translucent-crystal") await fail(`marbles should be translucent crystal: ${JSON.stringify(visuals)}`);
  for (const special of ["rainbow", "bomb"]) {
    const effects = visuals.specialMarbleEffects?.[special] || [];
    if (!effects.includes("halo") || !effects.includes("pulse")) await fail(`special ${special} needs obvious halo/pulse effects: ${JSON.stringify(effects)}`);
  }
  await screenshot("no-timer-launcher-visuals");

  await page.evaluate(() => window.forceSpecialMarble?.("bomb"));
  const frontState = await state("front-bomb-before");
  const frontTarget = frontState.chain.visible[0];
  const rect = await page.locator("canvas").boundingBox();
  await page.mouse.click(rect.x + frontTarget.x, rect.y + frontTarget.y);
  await step(1100);
  const frontAfter = await state("front-bomb-after");
  if ((frontAfter.chainPhysics?.totalBackwardPush || 0) !== 0 || (frontAfter.physics?.collisionRecoil || 0) !== 0) {
    await fail(`front explosion should not push the remaining chain backward: ${JSON.stringify({ physics: frontAfter.physics, chainPhysics: frontAfter.chainPhysics })}`);
  }

  await startFreshGame("middle-game-initial");
  await page.evaluate(() => window.forceSpecialMarble?.("bomb"));
  const middleState = await state("middle-bomb-before");
  const candidates = middleState.chain.visible.filter((ball) => ball.index > 5 && ball.index < middleState.chain.count - 5);
  const middleTarget = candidates[Math.floor(candidates.length / 2)] || middleState.chain.visible[Math.floor(middleState.chain.visible.length / 2)];
  const middleRect = await page.locator("canvas").boundingBox();
  await page.mouse.click(middleRect.x + middleTarget.x, middleRect.y + middleTarget.y);
  await step(1400);
  const middleAfter = await state("middle-bomb-after");
  if ((middleAfter.chainPhysics?.joinImpactCount || 0) < 1 || (middleAfter.chainPhysics?.lastJoinPush || 0) <= 0) {
    await fail(`middle explosion should only create backward push after rollback join impact: ${JSON.stringify(middleAfter.chainPhysics)}`);
  }
  if ((middleAfter.chainPhysics?.lastBlastPush || 0) !== 0) {
    await fail(`middle explosion should not apply immediate blast push before the join: ${JSON.stringify(middleAfter.chainPhysics)}`);
  }
  await screenshot("middle-bomb-join-physics");
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed" }, null, 2));
