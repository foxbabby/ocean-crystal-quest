import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/cascade-toad");
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
await step(300);

const initial = await state("initial");
if (
  initial.audio.musicProfile?.lowRumble !== false ||
  initial.audio.musicProfile?.noiseFree !== true ||
  initial.audio.musicProfile?.continuousLoop !== true
) {
  throw new Error(`background music should loop with no noise or low rumble: ${JSON.stringify(initial.audio.musicProfile)}`);
}
if (!initial.toad?.visible || initial.toad.kind !== "golden-toad" || initial.toad.suctionStrength <= 0 || initial.toad.mouthTarget !== "chain-front") {
  throw new Error(`toad maw state missing: ${JSON.stringify(initial.toad)}`);
}

await page.click('button[aria-label="爆裂"]');
await step(140);
const afterBurst = await state("after-burst");
if (!afterBurst.chainPhysics?.activeGap || afterBurst.chainPhysics.lastBlastPush !== 0 || afterBurst.chainPhysics.totalBackwardPush !== 0) {
  throw new Error(`burst should create a rollback gap without immediate backward push: ${JSON.stringify(afterBurst.chainPhysics)}`);
}
if (afterBurst.chainPhysics.frontRollbackSpeed <= afterBurst.difficulty.speedMultiplier) {
  throw new Error(`front chain should roll back quickly after explosion: ${JSON.stringify(afterBurst.chainPhysics)}`);
}

await step(1400);
const afterJoin = await state("after-join");
if (afterJoin.chainPhysics.joinImpactCount < 1 || afterJoin.chainPhysics.lastJoinPush <= 0) {
  throw new Error(`front chain should reconnect with a push impact: ${JSON.stringify(afterJoin.chainPhysics)}`);
}
if ((afterJoin.audio.eventCounts?.["join-impact"] || 0) < 1) {
  throw new Error(`missing special reconnect impact sound: ${JSON.stringify(afterJoin.audio.eventCounts)}`);
}
if (afterJoin.chainPhysics.totalBackwardPush <= 0) {
  throw new Error(`backward push should accumulate only after reconnect: ${JSON.stringify(afterJoin.chainPhysics)}`);
}

await page.screenshot({ path: path.join(outDir, "toad-gameplay.png"), fullPage: true });
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
      musicProfile: afterJoin.audio.musicProfile,
      chainPhysics: afterJoin.chainPhysics,
      toad: afterJoin.toad,
    },
    null,
    2,
  ),
);
