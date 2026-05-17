import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { addSubmission } from "@/lib/store";
import { generateMarketingCopy } from "@/lib/marketingCopy";
import { microlinkUrl, screenshotUrl, writeCachedShot } from "@/lib/screenshot";
import { dominantHeroColor } from "@/lib/imageColor";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  const name = String(body.name ?? "").trim();
  const pitch = String(body.pitch ?? "").trim();
  const segmentRaw = String(body.segment ?? "").trim();
  const segment: SegmentKey =
    segmentRaw in segments ? (segmentRaw as SegmentKey) : DEFAULT_SEGMENT;
  const consent = Boolean(body.consent);

  if (!url || !name || !pitch || !consent) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const id = randomUUID();

  // Run copy generation + screenshot capture in parallel — both are slow.
  const [copy, shotBuf] = await Promise.all([
    generateMarketingCopy({ name, pitch }),
    fetch(microlinkUrl(url, { fullPage: true }), {
      signal: AbortSignal.timeout(45_000),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Screenshot fetch failed: ${r.status}`);
        return Buffer.from(await r.arrayBuffer());
      }),
  ]).catch((e) => {
    throw e;
  });

  // Persist screenshot + derive brand color + dimensions.
  await writeCachedShot(id, shotBuf);
  const [brandColor, meta] = await Promise.all([
    dominantHeroColor(shotBuf),
    sharp(shotBuf).metadata(),
  ]);

  const submission = {
    id,
    url,
    name,
    pitch,
    createdAt: new Date().toISOString(),
    screenshotUrl: screenshotUrl(url, id),
    headline: copy.headline,
    bullets: [],
    caption: copy.caption,
    hashtags: copy.hashtags,
    language: copy.language,
    segment,
    brandColor,
    shotWidth: meta.width,
    shotHeight: meta.height,
  };

  await addSubmission(submission);

  return NextResponse.json({ ok: true, id, segment, language: copy.language });
}
