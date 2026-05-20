import { promises as fs } from "fs";
import path from "path";

export type Viewport = "mobile" | "desktop";

// Same-origin URL the browser uses. The queue card hits this to warm the
// screenshot cache before Generate kicks off the render routes.
export function screenshotUrl(target: string, id?: string, viewport?: Viewport) {
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  else params.set("url", target);
  if (viewport && viewport !== "mobile") params.set("viewport", viewport);
  return `/api/screenshot?${params.toString()}`;
}

// Microlink URL used server-side to actually fetch the screenshot.
// fullPage: true captures the entire scrollable height (used for the video scroll).
// viewport: "desktop" uses a 1440×900 desktop window, so the laptop mockup gets
//           a real landscape capture instead of a stretched mobile shot.
export function microlinkUrl(
  target: string,
  opts: { fullPage?: boolean; viewport?: Viewport } = {},
) {
  const cleaned = target.replace(/\/$/, "");
  const withProtocol = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
  const isDesktop = opts.viewport === "desktop";
  const params = new URLSearchParams({
    url: withProtocol,
    meta: "false",
    embed: "screenshot.url",
    "viewport.width": isDesktop ? "1440" : "390",
    "viewport.height": isDesktop ? "900" : "844",
    "viewport.deviceScaleFactor": isDesktop ? "1" : "2",
    "viewport.isMobile": isDesktop ? "false" : "true",
    waitForTimeout: "2500",
    type: "png",
  });
  if (opts.fullPage) {
    params.set("screenshot.fullPage", "true");
  } else {
    params.set("screenshot", "true");
  }
  return `https://api.microlink.io/?${params.toString()}`;
}

export const SHOTS_DIR = path.join(process.cwd(), "data", "screenshots");

// Cache key includes viewport so the laptop mockup's desktop capture doesn't
// collide with the phone mockup's mobile capture.
export function shotFilePath(id: string, viewport: Viewport = "mobile") {
  const suffix = viewport === "desktop" ? "-desktop" : "";
  return path.join(SHOTS_DIR, `${id}${suffix}.png`);
}

export async function readCachedShot(id: string, viewport: Viewport = "mobile") {
  try {
    return await fs.readFile(shotFilePath(id, viewport));
  } catch {
    return null;
  }
}

export async function writeCachedShot(
  id: string,
  buf: Buffer,
  viewport: Viewport = "mobile",
) {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  await fs.writeFile(shotFilePath(id, viewport), buf);
}
