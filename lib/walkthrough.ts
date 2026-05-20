// Playwright-driven walkthrough capture. Visits the project URL in a headless
// browser, then navigates into up to N additional same-origin pages and
// screenshots each one. The result is a sequence of viewport-sized PNGs the
// Reel can cut between to show an actual click-through of the app instead of
// scrolling a single landing-page screenshot.
//
// Cached on disk per (id, viewport, frame index). Long-lived — when the admin
// hits Generate the warm step calls /api/walkthrough first, then the render
// route reads from cache.

import { promises as fs } from "fs";
import path from "path";
import type { Browser } from "playwright";
import { chromium } from "playwright";
import type { Viewport } from "./screenshot";

const SHOTS_DIR = path.join(process.cwd(), "data", "screenshots");
const MAX_FRAMES = 5;

export type WalkthroughViewport = Viewport;

export function walkthroughFramePath(
  id: string,
  viewport: WalkthroughViewport,
  index: number,
) {
  const vp = viewport === "desktop" ? "desktop" : "mobile";
  return path.join(SHOTS_DIR, `${id}-walk-${vp}-${index}.png`);
}

export async function readWalkthroughFrames(
  id: string,
  viewport: WalkthroughViewport,
): Promise<Buffer[]> {
  const frames: Buffer[] = [];
  for (let i = 0; i < MAX_FRAMES; i++) {
    try {
      const buf = await fs.readFile(walkthroughFramePath(id, viewport, i));
      frames.push(buf);
    } catch {
      break;
    }
  }
  return frames;
}

/**
 * Capture a walkthrough: load the URL, then try to navigate to up to N
 * additional internal pages by clicking the most prominent in-page anchors.
 * Returns a list of viewport-sized PNG buffers, in order of visit. Always
 * returns at least one frame (the landing page) on success.
 */
export async function captureWalkthrough(
  id: string,
  targetUrl: string,
  viewport: WalkthroughViewport,
): Promise<Buffer[]> {
  await fs.mkdir(SHOTS_DIR, { recursive: true });

  const isMobile = viewport !== "desktop";
  const v = isMobile
    ? { width: 390, height: 844, deviceScaleFactor: 2 }
    : { width: 1440, height: 900, deviceScaleFactor: 1 };

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: v.deviceScaleFactor,
      isMobile,
      hasTouch: isMobile,
      userAgent: isMobile
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        : undefined,
    });
    const page = await ctx.newPage();

    // Frame 0: landing page.
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(800);
    const frames: Buffer[] = [
      Buffer.from(await page.screenshot({ fullPage: false, type: "png" })),
    ];

    // Collect up to MAX_FRAMES-1 unique same-origin links to walk into.
    const origin = new URL(targetUrl).origin;
    const hrefs: string[] = await page.evaluate((origin) => {
      const out: string[] = [];
      const seen = new Set<string>();
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
      for (const a of anchors) {
        const raw = a.getAttribute("href");
        if (!raw) continue;
        if (raw.startsWith("#") || raw.startsWith("javascript:") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;
        let abs: string;
        try { abs = new URL(raw, location.href).toString(); } catch { continue; }
        if (!abs.startsWith(origin)) continue;
        if (abs.replace(/#.*$/, "") === location.href.replace(/#.*$/, "")) continue;
        if (seen.has(abs)) continue;
        seen.add(abs);
        out.push(abs);
        if (out.length >= 8) break;
      }
      return out;
    }, origin);

    for (const href of hrefs) {
      if (frames.length >= MAX_FRAMES) break;
      try {
        await page.goto(href, { waitUntil: "domcontentloaded", timeout: 12000 });
        await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(600);
        frames.push(Buffer.from(await page.screenshot({ fullPage: false, type: "png" })));
      } catch {
        // skip pages we can't reach
      }
    }

    // Persist to disk for the render route to pick up.
    await Promise.all(
      frames.map((buf, i) =>
        fs.writeFile(walkthroughFramePath(id, viewport, i), buf),
      ),
    );

    return frames;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
