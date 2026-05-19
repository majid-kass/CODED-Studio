import { NextResponse } from "next/server";
import { microlinkUrl, readCachedShot, writeCachedShot } from "@/lib/screenshot";
import { listSubmissions } from "@/lib/store";

export const runtime = "nodejs";

// Microlink can return 429 (rate limit) or 5xx (worker recycle) intermittently
// on the free tier. Retry once after a short backoff before giving up so the
// admin doesn't have to click Generate twice for a transient blip.
async function fetchMicrolinkWithRetry(target: string): Promise<Buffer> {
  const url = microlinkUrl(target, { fullPage: true });
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

  // Cached lookup by submission id.
  if (id) {
    const cached = await readCachedShot(id);
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }
    // Fall back: if the submission exists but the file is missing, fetch it.
    const all = await listSubmissions();
    const s = all.find((x) => x.id === id);
    if (!s) return new NextResponse("Not found", { status: 404 });
    try {
      const buf = await fetchMicrolinkWithRetry(s.url);
      await writeCachedShot(id, buf);
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

  // Ad-hoc capture by URL (no caching — used for ephemeral preview).
  if (url) {
    try {
      const buf = await fetchMicrolinkWithRetry(url);
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
