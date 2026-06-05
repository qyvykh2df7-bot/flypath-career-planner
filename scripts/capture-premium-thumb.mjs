import { chromium } from "playwright";

const url = process.env.THUMB_URL ?? "http://localhost:3000/premium-report-thumb";
const out = "public/premium-report-preview.png";

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("#premium-report-preview-capture");
const el = await page.locator("#premium-report-preview-capture");
await el.screenshot({ path: out });
await browser.close();
console.log(`Saved ${out}`);
