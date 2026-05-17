import { promises as fs } from "fs";
import path from "path";

// Same-origin URL the browser uses. Routed through our own API so html-to-image
// can capture the composition without canvas-tainting CORS issues, and so the
// queue page can always render even before submit-time caching completes.
export function screenshotUrl(target: string, id?: string) {
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  else params.set("url", target);
  return `/api/screenshot?${params.toString()}`;
}

// Microlink URL used server-side to actually fetch the screenshot.
// fullPage: true captures the entire scrollable height (used for the video scroll).
export function microlinkUrl(target: string, opts: { fullPage?: boolean } = {}) {
  const cleaned = target.replace(/\/$/, "");
  const withProtocol = cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
  const params = new URLSearchParams({
    url: withProtocol,
    meta: "false",
    embed: "screenshot.url",
    "viewport.width": "390",
    "viewport.height": "844",
    "viewport.deviceScaleFactor": "2",
    "viewport.isMobile": "true",
    waitForTimeout: "2500",
    type: "png",
  });
  // NOTE: `screenshot=true` conflicts with `screenshot.fullPage=true` — the
  // boolean overrides the nested config object. Use one or the other.
  if (opts.fullPage) {
    params.set("screenshot.fullPage", "true");
  } else {
    params.set("screenshot", "true");
  }
  return `https://api.microlink.io/?${params.toString()}`;
}

export const SHOTS_DIR = path.join(process.cwd(), "data", "screenshots");

export function shotFilePath(id: string) {
  return path.join(SHOTS_DIR, `${id}.png`);
}

export async function readCachedShot(id: string) {
  try {
    return await fs.readFile(shotFilePath(id));
  } catch {
    return null;
  }
}

export async function writeCachedShot(id: string, buf: Buffer) {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  await fs.writeFile(shotFilePath(id), buf);
}
