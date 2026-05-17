import { NextResponse } from "next/server";
import { microlinkUrl, readCachedShot, writeCachedShot } from "@/lib/screenshot";
import { listSubmissions } from "@/lib/store";

export const runtime = "nodejs";

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
      const res = await fetch(microlinkUrl(s.url, { fullPage: true }), {
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) return new NextResponse(`Upstream ${res.status}`, { status: 502 });
      const buf = Buffer.from(await res.arrayBuffer());
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
      const res = await fetch(microlinkUrl(url, { fullPage: true }), {
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) return new NextResponse(`Upstream ${res.status}`, { status: 502 });
      const buf = Buffer.from(await res.arrayBuffer());
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
