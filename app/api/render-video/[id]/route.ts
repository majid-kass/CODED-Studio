import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { listSubmissions } from "@/lib/store";
import {
  microlinkUrl,
  readCachedShot,
  writeCachedShot,
} from "@/lib/screenshot";
import { brandedBackground, dominantHeroColor } from "@/lib/imageColor";

export const runtime = "nodejs";
export const maxDuration = 600;

// Project-local renders directory. macOS aggressively cleans /var/folders tmp
// during long-running operations which was killing FFmpeg's moov-atom finalize.
const RENDERS_DIR = () => path.join(process.cwd(), "data", "renders");

// Cache the bundled Remotion project so subsequent renders are fast.
let bundleCache: Promise<string> | null = null;

function getBundle() {
  if (!bundleCache) {
    bundleCache = bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      webpackOverride: (config) => config,
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

async function getOrFetchShot(id: string, url: string): Promise<Buffer> {
  const cached = await readCachedShot(id);
  if (cached) return cached;
  const res = await fetch(microlinkUrl(url, { fullPage: true }), {
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Screenshot fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeCachedShot(id, buf);
  return buf;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const all = await listSubmissions();
  const s = all.find((x) => x.id === id);
  if (!s) return new Response("Not found", { status: 404 });

  try {
    const [serveUrl, logoDataUrl, shotBuf] = await Promise.all([
      getBundle(),
      fileDataUrl("brand/coded-logo-white.png", "image/png"),
      getOrFetchShot(id, s.url),
    ]);

    // Derive brand color + dimensions on the fly if missing from the submission.
    const [meta, sampledColor] = await Promise.all([
      sharp(shotBuf).metadata(),
      s.brandColor ? Promise.resolve(s.brandColor) : dominantHeroColor(shotBuf),
    ]);
    const shotWidth = s.shotWidth ?? meta.width ?? 780;
    const shotHeight = s.shotHeight ?? meta.height ?? 1688;
    const bg = brandedBackground(sampledColor);

    const shotDataUrl = bufferToDataUrl(shotBuf);

    const inputProps = {
      headline: s.headline,
      projectName: s.name,
      logoDataUrl,
      shotDataUrl,
      shotWidth,
      shotHeight,
      bgBase: bg.base,
      bgAccent: bg.accent,
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
