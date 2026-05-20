import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/store";
import type { Viewport } from "@/lib/screenshot";
import {
  captureWalkthrough,
  readWalkthroughFrames,
} from "@/lib/walkthrough";

export const runtime = "nodejs";
// Walkthrough = N pages × (goto + networkidle + screenshot) ≈ 20–40s typical.
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const u = new URL(req.url);
  const v = u.searchParams.get("viewport");
  const viewport: Viewport = v === "desktop" ? "desktop" : "mobile";

  const all = await listSubmissions();
  const s = all.find((x) => x.id === id);
  if (!s) return new NextResponse("Not found", { status: 404 });

  // Skip if we already have cached frames for this id+viewport.
  const existing = await readWalkthroughFrames(id, viewport);
  if (existing.length > 0) {
    return NextResponse.json({ ok: true, frames: existing.length, cached: true });
  }

  try {
    const frames = await captureWalkthrough(id, s.url, viewport);
    return NextResponse.json({ ok: true, frames: frames.length, cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Walkthrough failed";
    return new NextResponse(msg, { status: 502 });
  }
}
