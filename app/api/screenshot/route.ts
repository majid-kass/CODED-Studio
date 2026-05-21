import { NextResponse } from "next/server";
import {
  microlinkUrl,
  readCachedShot,
  writeCachedShot,
  type Viewport,
} from "@/lib/screenshot";
import { listSubmissions } from "@/lib/store";

export const runtime = "nodejs";

async function fetchMicrolinkWithRetry(
  target: string,
  viewport: Viewport,
): Promise<Buffer> {
  const url = microlinkUrl(target, { fullPage: true, viewport });
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 1 || (res.status !== 429 && res.status < 500)) {
      const body = (await res.text().catch(() => "")).slice(0, 200);
      throw new Error(`Microlink ${res.status}${body ? ` — ${body}` : ""}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Microlink retry exhausted");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const url = searchParams.get("url");
  const viewportRaw = searchParams.get("viewport");
  const viewport: Viewport = viewportRaw === "desktop" ? "desktop" : "mobile";

  if (id) {
    const cached = await readCachedShot(id, viewport);
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }
    const all = await listSubmissions();
    const s = all.find((x) => x.id === id);
    if (!s) return new NextResponse("Not found", { status: 404 });
    try {
      const buf = await fetchMicrolinkWithRetry(s.url, viewport);
      await writeCachedShot(id, buf, viewport);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch failed";
      return new NextResponse(msg, { status: 502 });
    }
  }

  if (url) {
    try {
      const buf = await fetchMicrolinkWithRetry(url, viewport);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch failed";
      return new NextResponse(msg, { status: 502 });
    }
  }

  return new NextResponse("Missing id or url", { status: 400 });
}
