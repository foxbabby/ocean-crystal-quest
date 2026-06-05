import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/insertion-rolling");
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

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") await window.advanceTime(advanceMs);
  }, ms);
}

async function state(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) await fail(`missing render_game_to_text at ${label}`);
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

async function clickCanvasAtGamePoint(point) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) await fail("canvas missing");
  await page.mouse.click(box.x + point.x, box.y + point.y);
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
  await page.click(".play-button");
  await page.waitForSelector("canvas");
  await step(260);

  const initial = await state("initial");
  if (!initial.visuals?.rollingTexture || initial.visuals?.surfaceTextures !== "rolling-crystal-patterns") {
    await fail(`visual profile should expose rolling textures: ${JSON.stringify(initial.visuals)}`);
  }
  const textured = initial.chain.visible.filter((ball) => Number.isFinite(ball.textureVariant) && Number.isFinite(ball.roll));
  if (textured.length < Math.min(6, initial.chain.visible.length)) {
    await fail(`visible balls should expose texture and roll data: ${JSON.stringify(initial.chain.visible)}`);
  }

  const visible = initial.chain.visible;
  const colorCount = new Set(visible.map((ball) => ball.colorIndex)).size;
  let target = null;
  let shotColor = null;
  for (let i = 1; i < visible.length - 2; i += 1) {
    const left = visible[i];
    const right = visible[i + 1];
    for (let colorIndex = 0; colorIndex < colorCount + 2; colorIndex += 1) {
      if (colorIndex !== left.colorIndex && colorIndex !== right.colorIndex) {
        target = left;
        shotColor = colorIndex;
        break;
      }
    }
    if (target) break;
  }
  if (!target || shotColor == null) await fail(`could not find a safe insertion target: ${JSON.stringify(visible)}`);

  await page.evaluate((colorIndex) => window.debugSetCurrentColor?.(colorIndex), shotColor);
  const prepared = await state("prepared-shot");
  if (prepared.shooter.currentShot.special !== null) await fail(`current shot should be normal: ${JSON.stringify(prepared.shooter.currentShot)}`);

  const beforeCount = prepared.chain.count;
  const beforeHead = prepared.chain.headDistance;
  await clickCanvasAtGamePoint(target);
  await step(180);
  const afterInsert = await state("after-insert");

  if (afterInsert.physics.impactCount < 1) await fail(`ordinary hit should count as an impact: ${JSON.stringify(afterInsert.physics)}`);
  if (afterInsert.physics.lastImpactDirection !== "forward") {
    await fail(`ordinary hit should be a forward insert, not backward recoil: ${JSON.stringify(afterInsert.physics)}`);
  }
  if (afterInsert.physics.lastImpactKnockback !== 0 || afterInsert.physics.collisionRecoil !== 0) {
    await fail(`ordinary insertion must not create backward recoil: ${JSON.stringify(afterInsert.physics)}`);
  }
  if (afterInsert.chainPhysics.totalBackwardPush !== 0) {
    await fail(`ordinary insertion must not increase backward push: ${JSON.stringify(afterInsert.chainPhysics)}`);
  }
  if (afterInsert.physics.lastInsertionPush <= 0 || afterInsert.chainPhysics.totalForwardPush <= 0) {
    await fail(`ordinary insertion should push the chain forward: ${JSON.stringify({ physics: afterInsert.physics, chainPhysics: afterInsert.chainPhysics })}`);
  }
  if (afterInsert.chain.count !== beforeCount + 1) {
    await fail(`ordinary insertion should add one marble without matching: before ${beforeCount}, after ${afterInsert.chain.count}`);
  }
  if (afterInsert.chain.headDistance <= beforeHead) {
    await fail(`chain head should move forward after insertion: before ${beforeHead}, after ${afterInsert.chain.headDistance}`);
  }

  await step(900);
  const afterRoll = await state("after-roll");
  const matchingBefore = new Map(afterInsert.chain.visible.map((ball) => [ball.id, ball.roll]));
  const rolled = afterRoll.chain.visible.some((ball) => matchingBefore.has(ball.id) && Math.abs(ball.roll - matchingBefore.get(ball.id)) >= 0.08);
  if (!rolled) await fail(`texture roll values should change while marbles move: before ${JSON.stringify(afterInsert.chain.visible)}, after ${JSON.stringify(afterRoll.chain.visible)}`);

  const hintCount = await page.locator(".tap-hint").count();
  if (hintCount !== 0) await fail(`fire text hint should be removed, found ${hintCount}`);

  await page.screenshot({ path: path.join(outDir, "rolling-textured-insert.png"), fullPage: true });
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed" }, null, 2));
