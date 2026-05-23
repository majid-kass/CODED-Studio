import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/store";
import { resolveCopyForLang, type LangChoice } from "@/lib/renderOptions";

export const runtime = "nodejs";
export const maxDuration = 30;

// Returns the resolved copy (headline, caption, features) in the requested
// language. Used by the queue card to preview the Arabic / English caption
// the moment the admin flips the Language picker — without having to kick
// off a full Image / Carousel / Reel render.
//
// First request for a non-native language calls Claude to translate; the
// translation is cached on the submission row, so subsequent requests for
// the same (id, lang) come back instantly.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const u = new URL(req.url);
  const l = u.searchParams.get("lang");
  const lang: LangChoice = l === "en" || l === "ar" ? l : "auto";

  const all = await listSubmissions();
  const s = all.find((x) => x.id === id);
  if (!s) return new NextResponse("Not found", { status: 404 });

  try {
    const copy = await resolveCopyForLang(s, lang);
    return NextResponse.json(copy);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Translation failed";
    return new NextResponse(msg, { status: 502 });
  }
}
