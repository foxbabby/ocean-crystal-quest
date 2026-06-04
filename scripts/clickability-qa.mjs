import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/clickability");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const failures = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));
await page.addInitScript(() => {
  localStorage.removeItem("ocean-crystal-quest-save-v3");
  localStorage.removeItem("ocean-crystal-quest-save-v4");
});

function safeName(name) {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function screenshot(name) {
  await page.screenshot({ path: path.join(outDir, `${safeName(name)}.png`), fullPage: true });
}

async function visible(selector, name) {
  try {
    await page.waitForSelector(selector, { state: "visible", timeout: 2500 });
  } catch (error) {
    failures.push(`${name} not visible: ${selector}`);
    throw error;
  }
}

async function hidden(selector, name) {
  try {
    await page.waitForSelector(selector, { state: "hidden", timeout: 2500 });
  } catch (error) {
    failures.push(`${name} not hidden: ${selector}`);
    throw error;
  }
}

async function clickOne(selector, name) {
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count !== 1) {
    failures.push(`${name} expected one target, found ${count}: ${selector}`);
    throw new Error(failures.at(-1));
  }
  await locator.click();
}

async function openPanel(selector, panelId, name) {
  await clickOne(selector, name);
  await visible(`.modal-panel[data-panel="${panelId}"]`, `${name} panel`);
  await screenshot(name);
}

async function closePanel(name) {
  await clickOne('button[aria-label="Close panel"]', `${name} close`);
  await hidden(".modal-panel", `${name} panel`);
}

async function readGameState(label) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? null);
  if (!raw) {
    failures.push(`${label} missing render_game_to_text`);
    throw new Error(failures.at(-1));
  }
  const parsed = JSON.parse(raw);
  fs.writeFileSync(path.join(outDir, `${safeName(label)}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

async function step(ms) {
  await page.evaluate(async (advanceMs) => {
    if (typeof window.advanceTime === "function") await window.advanceTime(advanceMs);
  }, ms);
}

async function runDesktopSelect() {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await visible(".select-screen", "desktop select");
  await screenshot("desktop select initial");

  await openPanel('button[aria-label="Settings"]', "settings", "desktop settings");
  const audioToggle = page.locator(".panel-row-button").first();
  const before = await audioToggle.getAttribute("aria-pressed");
  await audioToggle.click();
  const after = await audioToggle.getAttribute("aria-pressed");
  if (before === after) {
    failures.push("settings audio toggle did not change aria-pressed");
    throw new Error(failures.at(-1));
  }
  await screenshot("desktop settings toggled");
  await closePanel("desktop settings");

  await openPanel('button[aria-label="Back"]', "menu", "desktop menu");
  await clickOne('button[aria-label="Open levels"]', "desktop menu levels");
  await visible('.modal-panel[data-panel="levels"]', "desktop levels");
  await screenshot("desktop levels");
  await closePanel("desktop levels");

  await openPanel('button[aria-label="Back"]', "menu", "desktop menu continue open");
  await clickOne('button[aria-label="Continue menu"]', "desktop menu continue");
  await hidden(".modal-panel", "desktop menu");

  await openPanel('button[aria-label="Inventory"]', "bag", "desktop bag");
  await openPanel('.panel-card-button[aria-label="电光 details"]', "item-surge", "desktop item surge");
  await clickOne(".panel-action-button:not(.primary)", "desktop item bag action");
  await visible('.modal-panel[data-panel="bag"]', "desktop bag after item");
  await closePanel("desktop bag");

  for (const label of ["电光", "冰冻", "爆裂", "棱镜"]) {
    await openPanel(`button[aria-label="${label} inventory"]`, `item-${label === "电光" ? "surge" : label === "冰冻" ? "freeze" : label === "爆裂" ? "burst" : "prism"}`, `desktop inventory ${label}`);
    await closePanel(`desktop inventory ${label}`);
  }

  await clickOne('.scene-card[data-scene="neon"]', "desktop scene neon");
  await screenshot("desktop select neon");
}

async function runDesktopGame() {
  await clickOne(".play-button", "desktop play");
  await visible("canvas", "game canvas");
  await step(500);
  await readGameState("desktop game initial");

  await clickOne('[data-hud-audio="music"]', "game music toggle");
  if ((await page.locator('[data-hud-audio="sfx"]').count()) !== 1) {
    failures.push("game SFX toggle missing");
    throw new Error(failures.at(-1));
  }
  await step(120);
  await clickOne('button[aria-label="Pause"]', "game pause");
  await step(120);
  await visible('button[aria-label="Resume"]', "game resume button");
  await screenshot("desktop game paused");
  await clickOne('button[aria-label="Resume"]', "game resume");

  for (const label of ["电光", "冰冻", "爆裂"]) {
    await clickOne(`button[aria-label="${label}"]`, `game powerup ${label}`);
    await step(240);
  }

  await clickOne(".secondary-button", "game restart");
  await step(240);
  const state = await readGameState("desktop game after controls");
  if (state.mode !== "playing") {
    failures.push(`game mode after controls expected playing, got ${state.mode}`);
    throw new Error(failures.at(-1));
  }
  await screenshot("desktop game controls");

  await clickOne('button[aria-label="Back to scene select"]', "game home");
  await visible(".select-screen", "select after game home");
}

async function runMobileSelect() {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await visible(".mobile-tabs", "mobile tabs");
  await screenshot("mobile select initial");

  const tabPanels = [
    [".mobile-tabs button:nth-child(1)", "shop", "mobile shop"],
    [".mobile-tabs button:nth-child(2)", "quests", "mobile quests"],
    [".mobile-tabs button:nth-child(4)", "rank", "mobile rank"],
    [".mobile-tabs button:nth-child(5)", "bag", "mobile bag"],
  ];

  for (const [selector, panel, name] of tabPanels) {
    await openPanel(selector, panel, name);
    if (panel === "shop") {
      const aquaCore = page.locator('button[aria-label="Buy Aqua Core"]');
      if (!(await aquaCore.isDisabled())) {
        failures.push("Aqua Core should be disabled for a new player with 0 coins");
        throw new Error(failures.at(-1));
      }
      await screenshot("mobile shop new player");
    }
    await closePanel(name);
  }

  await openPanel(".mobile-tabs button:nth-child(5)", "bag", "mobile bag home close");
  await clickOne(".mobile-tabs button:nth-child(3)", "mobile home tab");
  await hidden(".modal-panel", "mobile home closed panel");

  await openPanel('button[aria-label="Settings"]', "settings", "mobile settings");
  await closePanel("mobile settings");
  await screenshot("mobile select final");
}

try {
  await runDesktopSelect();
  await runDesktopGame();
  await runMobileSelect();
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed", errors: 0, failures: 0 }, null, 2));
