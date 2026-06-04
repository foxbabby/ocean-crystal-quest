import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outDir = path.resolve("output/language");
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const failures = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const saveKey = "ocean-crystal-quest-save-v4";

page.on("console", (message) => {
  if (message.type() === "error") errors.push({ type: "console", text: message.text() });
});
page.on("pageerror", (error) => errors.push({ type: "pageerror", text: String(error) }));

async function screenshot(name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function assertText(selector, pattern, name) {
  const text = (await page.locator(selector).first().innerText()).trim();
  if (!pattern.test(text)) {
    failures.push(`${name} expected ${pattern}, got "${text}"`);
    throw new Error(failures.at(-1));
  }
}

async function assertSavedLanguage(expected) {
  await page.waitForFunction(
    ([key, language]) => JSON.parse(localStorage.getItem(key) || "null")?.language === language,
    [saveKey, expected],
  );
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

  await assertText(".play-button", /开始/, "default Chinese play button");
  await screenshot("default-zh");

  await page.click('button[aria-label="Settings"]');
  await page.waitForSelector('.modal-panel[data-panel="settings"]');
  await assertText("#panel-title-settings", /设置/, "default Chinese settings title");
  await assertText(".language-option:nth-child(1)", /中文/, "Chinese option");
  await assertText(".language-option:nth-child(2)", /英语/, "English option in Chinese");
  await screenshot("settings-zh");

  await page.locator(".language-option").nth(1).click();
  await assertText("#panel-title-settings", /Settings/i, "English settings title");
  await assertText(".language-option:nth-child(1)", /Chinese/, "Chinese option in English");
  await assertText(".language-option:nth-child(2)", /English/, "English option");
  await assertText(".play-button", /Play/i, "English play button");
  await assertSavedLanguage("en");
  await screenshot("settings-en");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".select-screen");
  await assertText(".play-button", /Play/i, "persisted English play button");
  await page.click('button[aria-label="Settings"]');
  await page.waitForSelector('.modal-panel[data-panel="settings"]');
  await assertText("#panel-title-settings", /Settings/i, "persisted English settings title");
  await screenshot("persisted-en");

  await page.locator(".language-option").nth(0).click();
  await assertText("#panel-title-settings", /设置/, "switched Chinese settings title");
  await assertText(".play-button", /开始/, "switched Chinese play button");
  await assertSavedLanguage("zh");
  await screenshot("switched-zh");
} finally {
  fs.writeFileSync(path.join(outDir, "errors.json"), JSON.stringify({ errors, failures }, null, 2));
  await browser.close();
}

if (errors.length || failures.length) {
  console.error(JSON.stringify({ errors, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ result: "passed", defaultLanguage: "zh", supported: ["zh", "en"] }, null, 2));
