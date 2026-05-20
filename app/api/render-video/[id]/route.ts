import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { promises as fs } from "fs";
import path from "path";
import { listSubmissions } from "@/lib/store";
import {
  microlinkUrl,
  readCachedShot,
  writeCachedShot,
  type Viewport,
} from "@/lib/screenshot";
import sharp from "sharp";
import { brandBg, getSegment } from "@/lib/brandTheme";
import { parseRenderOptions, applyThemeOverride } from "@/lib/renderOptions";
import { readWalkthroughFrames } from "@/lib/walkthrough";

// Disable Webpack persistent disk cache so MarketingReel edits show up on
// the very next render. Without this, even mtime-busting the in-memory
// bundle promise can re-hydrate from .next/cache and replay the old reel.
function disablePersistentCache(config: object) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (config as any).cache = false;
  return config;
}

export const runtime = "nodejs";
export const maxDuration = 600;

// Project-local renders directory. macOS aggressively cleans /var/folders tmp
// during long-running operations which was killing FFmpeg's moov-atom finalize.
const RENDERS_DIR = () => path.join(process.cwd(), "data", "renders");

// Cache the bundled Remotion project so subsequent renders are fast. Invalidate
// when any file under remotion/ changes — otherwise editing MarketingReel.tsx
// without touching this route would never bust the cache.
let bundleCache: Promise<string> | null = null;
let bundleSig: string | null = null;

async function remotionSignature(): Promise<string> {
  const dir = path.join(process.cwd(), "remotion");
  const out: string[] = [];
  async function walk(d: string) {
    for (const name of await fs.readdir(d)) {
      const full = path.join(d, name);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) await walk(full);
      else if (/\.(tsx?|jsx?|json)$/.test(name)) {
        out.push(`${full}:${stat.mtimeMs}`);
      }
    }
  }
  await walk(dir);
  return out.sort().join("|");
}

async function getBundle() {
  const sig = await remotionSignature();
  if (!bundleCache || bundleSig !== sig) {
    bundleSig = sig;
    bundleCache = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      webpackOverride: disablePersistentCache,
    });
  }
  return bundleCache;
}

async function fileDataUrl(rel: string, mime: string) {
  const buf = await fs.readFile(path.join(process.cwd(), "public", rel));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function bufferToDataUrl(buf: Buffer, mime = "image/png") {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function getOrFetchShot(
  id: string,
  url: string,
  viewport: Viewport,
): Promise<Buffer> {
  const cached = await readCachedShot(id, viewport);
  if (cached) return cached;
  const res = await fetch(microlinkUrl(url, { fullPage: true, viewport }), {
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Screenshot fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeCachedShot(id, buf, viewport);
  return buf;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const all = await listSubmissions();
  const s = all.find((x) => x.id === id);
  if (!s) return new Response("Not found", { status: 404 });

  try {
    const { themeOverride, mockup } = parseRenderOptions(req);
    const viewport: Viewport = mockup === "laptop" ? "desktop" : "mobile";

    const seg = getSegment(s.segment);
    const bg = applyThemeOverride(brandBg(seg), themeOverride);

    const [serveUrl, shotBuf, aiLockup, walkFrames] = await Promise.all([
      getBundle(),
      getOrFetchShot(id, s.url, viewport),
      seg.key === "ai-app-developer"
        ? fileDataUrl("brand/ai-app-developer-white.png", "image/png")
        : Promise.resolve(""),
      readWalkthroughFrames(id, viewport),
    ]);

    const meta = await sharp(shotBuf).metadata();
    const shotWidth = s.shotWidth ?? meta.width ?? (viewport === "desktop" ? 1440 : 780);
    const shotHeight = s.shotHeight ?? meta.height ?? (viewport === "desktop" ? 900 : 1688);
    const shotDataUrl = bufferToDataUrl(shotBuf);
    // Each walkthrough frame becomes a data URL passed to Remotion. Empty
    // array (no walkthrough run yet) falls back to the long-page scroll
    // behaviour the Reel already supports.
    const walkthroughFrames = walkFrames.map((buf) => bufferToDataUrl(buf));

    const inputProps = {
      headline: s.headline,
      projectName: s.name,
      segmentKey: seg.key,
      segmentLabel: seg.label,
      aiLockup,
      shotDataUrl,
      shotWidth,
      shotHeight,
      bgBase: bg.base,
      bgAccent: bg.accent,
      bgGradient: bg.cssGradient,
      bgOverlay: bg.cssOverlay ?? "",
      segAccent: seg.accent,
      theme: bg.theme,
      textColor: bg.text,
      textDimColor: bg.textDim,
      features: s.features ?? [],
      mockup,
      walkthroughFrames,
    };

    const composition = await selectComposition({
      serveUrl,
      id: "MarketingReel",
      inputProps,
    });

    const safeName = s.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await fs.mkdir(RENDERS_DIR(), { recursive: true });
    const outPath = path.join(RENDERS_DIR(), `coded-reel-${id}.mp4`);

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
      concurrency: 2,
    });

    const mp4 = await fs.readFile(outPath);
    await fs.unlink(outPath).catch(() => {});

    return new Response(new Uint8Array(mp4), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${safeName || "post"}-coded.mp4"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "render failed";
    console.error("Video render failed:", e);
    return new Response(msg, { status: 500 });
  }
}
