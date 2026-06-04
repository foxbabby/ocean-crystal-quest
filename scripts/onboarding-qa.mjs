import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/onboarding");
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

async function expectText(selector, pattern, name) {
  const text = (await page.locator(selector).first().innerText()).trim();
  if (!pattern.test(text)) await fail(`${name} expected ${pattern}, got "${text}"`);
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
  if (saved.profileLevel !== 1) await fail(`expected profileLevel 1, got ${saved.profileLevel}`);
  if (saved.xp !== 0 || saved.coins !== 0 || saved.gems !== 0) {
    await fail(`expected xp/coins/gems to start at 0, got ${JSON.stringify({ xp: saved.xp, coins: saved.coins, gems: saved.gems })}`);
  }
  await expectText(".profile-medal", /Lv\. 1/, "new player level");
  await expectText(".select-currencies", /0/, "new player resources");
  await screenshot("new-player-home");

  await page.click(".profile-medal");
  await page.waitForSelector('.modal-panel[data-panel="profile"]');
  await expectText("#panel-title-profile", /档案/, "profile panel");
  await expectText(".modal-body", /等级从 1 级开始/, "profile explanation");
  await screenshot("profile-explainer");
  await page.click('button[aria-label="Close panel"]');

  await page.locator(".select-currencies .stat-pill").first().click();
  await page.waitForSelector('.modal-panel[data-panel="wallet"]');
  await expectText("#panel-title-wallet", /资源/, "wallet panel");
  await expectText(".modal-body", /金币用于购买/, "coin explanation");
  await expectText(".modal-body", /宝石是稀有资源/, "gem explanation");
  await screenshot("wallet-explainer");
  await page.click(".panel-action-button.primary");
  await page.waitForSelector('.modal-panel[data-panel="shop"]');
  await expectText(".modal-body", /永久升级/, "shop upgrade section");
  await expectText(".modal-body", /道具补给/, "shop power-up section");
  const shopPowerups = await page.locator("[data-shop-powerup]").count();
  if (shopPowerups !== 4) await fail(`expected 4 shop power-up cards, got ${shopPowerups}`);
  await screenshot("shop-powerups");
  await page.click('button[aria-label="Close panel"]');

  await page.click('button[aria-label="电光 inventory"]');
  await page.waitForSelector('.modal-panel[data-panel="item-surge"]');
  await expectText(".modal-body", /作用/, "power-up effect label");
  await expectText(".modal-body", /使用/, "power-up use label");
  await expectText(".modal-body", /获取/, "power-up get label");
  await expectText(".modal-body", /进入关卡后/, "power-up use explanation");
  await expectText(".modal-body", /商店/, "power-up acquire explanation");
  await screenshot("powerup-detail");
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed", profileLevel: 1, xp: 0, coins: 0, gems: 0 }, null, 2));
