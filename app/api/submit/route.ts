import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addSubmission } from "@/lib/store";
import { generateMarketingCopy } from "@/lib/marketingCopy";
import { screenshotUrl } from "@/lib/screenshot";
import {
  segments,
  DEFAULT_SEGMENT,
  type SegmentKey,
} from "@/lib/brandTheme";

export const runtime = "nodejs";
export const maxDuration = 30;

// Submit only runs Claude (cheap, ~2-5s) and persists. Screenshot + renders are
// gated behind admin action in the queue UI to avoid burning Microlink calls
// and render compute on submissions the admin will reject.
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
  const submitterName = String(body.submitterName ?? "").trim();
  const submitterEmail = String(body.submitterEmail ?? "").trim();

  if (!url || !name || !pitch || !consent || !submitterName || !submitterEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const id = randomUUID();
  const copy = await generateMarketingCopy({ name, pitch });

  await addSubmission({
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
    features: copy.features,
    language: copy.language,
    segment,
    submitterName,
    submitterEmail,
  });

  return NextResponse.json({ ok: true, id, segment, language: copy.language });
}
