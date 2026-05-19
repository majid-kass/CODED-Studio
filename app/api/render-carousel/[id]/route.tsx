import { ImageResponse } from "next/og";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import JSZip from "jszip";
import { listSubmissions } from "@/lib/store";
import { microlinkUrl, readCachedShot, writeCachedShot } from "@/lib/screenshot";
import {
  brandBg,
  getSegment,
  type BgTreatment,
  type SegmentPalette,
  type SegmentKey,
} from "@/lib/brandTheme";
import { SegmentLogo } from "@/components/SegmentLogo";

export const runtime = "nodejs";

// Instagram carousel slides: 1080×1350 (4:5 portrait, IG-recommended).
const W = 1080;
const H = 1350;
const PAD = 80;

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

// Crop a vertical phone-aspect window from the full-page screenshot.
async function cropAtScroll(
  shotBuf: Buffer,
  scrollT: number,
  shotW: number,
  shotH: number,
) {
  const cropAspect = 9 / 19.5;
  const cropW = shotW;
  const cropH = Math.min(shotH, Math.round(shotW / cropAspect));
  const maxTop = Math.max(0, shotH - cropH);
  const top = Math.round(maxTop * Math.max(0, Math.min(1, scrollT)));
  const buf = await sharp(shotBuf)
    .extract({ left: 0, top, width: cropW, height: cropH })
    .png()
    .toBuffer();
  return bufferToDataUrl(buf);
}

// Reused tokens for every slide.
type Ctx = {
  bg: BgTreatment;
  seg: SegmentPalette;
  segmentKey: SegmentKey;
  aiLockup?: string;
};

// ─── Frame layer used by every slide ─────────────────────────────────────────
function SlideFrame({
  ctx,
  slideNum,
  children,
}: {
  ctx: Ctx;
  slideNum: number;
  children: React.ReactNode;
}) {
  const { bg, seg, segmentKey, aiLockup } = ctx;
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        backgroundColor: bg.base,
        backgroundImage: bg.cssOverlay
          ? `${bg.cssOverlay}, ${bg.cssGradient}`
          : bg.cssGradient,
        color: bg.text,
        fontFamily: "sans-serif",
        padding: PAD,
        overflow: "hidden",
      }}
    >
      <CornerBracket x="left" y="top" color={bg.rule} opacity={0.18} />
      <CornerBracket x="right" y="bottom" color={seg.accent} opacity={0.55} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <SegmentLogo
          width={300}
          segment={segmentKey}
          aiAppDeveloperDataUrl={aiLockup}
          color={bg.text}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: 6,
            color: bg.textDim,
            fontWeight: 700,
          }}
        >
          <span style={{ display: "flex" }}>{`${String(slideNum).padStart(2, "0")} / 05`}</span>
        </div>
      </div>

      {children}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 22,
          color: bg.textDim,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        <div style={{ display: "flex" }}>coded.kw</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ display: "flex" }}>@coded.kw</span>
        </div>
      </div>
    </div>
  );
}

// Bracket mark anchored to a corner. Used for the framing motif.
function CornerBracket({
  x,
  y,
  color,
  opacity,
}: {
  x: "left" | "right";
  y: "top" | "bottom";
  color: string;
  opacity: number;
}) {
  const size = 130;
  const stroke = 6;
  const off = 30;
  const isLeft = x === "left";
  const isTop = y === "top";
  return (
    <div
      style={{
        position: "absolute",
        ...(isLeft ? { left: off } : { right: off }),
        ...(isTop ? { top: off } : { bottom: off }),
        width: size,
        height: size,
        display: "flex",
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* Two perpendicular lines forming an L-shaped bracket corner. */}
      <div
        style={{
          position: "absolute",
          ...(isLeft ? { left: 0 } : { right: 0 }),
          ...(isTop ? { top: 0 } : { bottom: 0 }),
          width: stroke,
          height: size,
          backgroundColor: color,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          ...(isLeft ? { left: 0 } : { right: 0 }),
          ...(isTop ? { top: 0 } : { bottom: 0 }),
          width: size,
          height: stroke,
          backgroundColor: color,
          display: "flex",
        }}
      />
    </div>
  );
}

// Reusable phone mockup with rim glow, drop shadow, and content-fit screenshot.
function Phone({
  shot,
  width,
  glow,
  objectPosition = "top",
}: {
  shot: string;
  width: number;
  glow: string;
  objectPosition?: "top" | "center" | "bottom";
}) {
  const height = Math.round(width * (19.5 / 9));
  const inset = Math.max(8, Math.round(width * 0.028));
  const radius = Math.round(width * 0.18);
  const inner = Math.round(radius - inset / 2);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        backgroundColor: "#0a0a0a",
        borderRadius: radius,
        padding: inset,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${glow}55`,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          borderRadius: inner,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shot}
          alt=""
          width={width - inset * 2}
          height={height - inset * 2}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
          }}
        />
        {/* Dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.26,
            height: width * 0.058,
            backgroundColor: "#000",
            borderRadius: 999,
            display: "flex",
          }}
        />
        {/* Soft bottom fade — lets the screenshot melt into the bezel instead
            of hard-cutting whatever happens to be at the crop boundary. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: height * 0.18,
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 1: Cover ──────────────────────────────────────────────────────────
function SlideCover({
  ctx,
  headline,
  shot,
}: {
  ctx: Ctx;
  headline: string;
  shot: string;
}) {
  const { seg, bg } = ctx;
  return (
    <SlideFrame ctx={ctx} slideNum={1}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          marginTop: 40,
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: seg.accent,
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          <span style={{ display: "flex" }}>[</span>
          <span style={{ display: "flex" }}>Built with AI</span>
          <span style={{ display: "flex" }}>]</span>
        </div>
        <div
          style={{
            display: "flex",
            color: bg.text,
            fontSize: 88,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -2,
            maxWidth: 920,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "flex-end",
            marginTop: 8,
          }}
        >
          <Phone shot={shot} width={420} glow={seg.accent} objectPosition="top" />
        </div>
      </div>
    </SlideFrame>
  );
}

// ─── Slide 2: Meet the project ──────────────────────────────────────────────
function SlideMeet({
  ctx,
  projectName,
  pitch,
}: {
  ctx: Ctx;
  projectName: string;
  pitch: string;
}) {
  const { seg, bg } = ctx;
  return (
    <SlideFrame ctx={ctx} slideNum={2}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          gap: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            color: seg.accent,
            fontSize: 26,
            letterSpacing: 10,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Meet
        </div>
        <div
          style={{
            display: "flex",
            color: bg.text,
            fontSize: 168,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -5,
          }}
        >
          {projectName}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 38,
            lineHeight: 1.35,
            fontWeight: 500,
            color: bg.textDim,
            maxWidth: 780,
            marginTop: 12,
          }}
        >
          {pitch}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            width: 160,
            height: 6,
            backgroundColor: seg.accent,
          }}
        />
      </div>
    </SlideFrame>
  );
}

// ─── Slide 3 / Slide 4: In-action with feature callouts ─────────────────────
function SlideAction({
  ctx,
  shot,
  caption,
  eyebrow,
  slideNum,
  objectPosition,
}: {
  ctx: Ctx;
  shot: string;
  caption: string;
  eyebrow: string;
  slideNum: number;
  objectPosition: "top" | "center" | "bottom";
}) {
  const { seg, bg } = ctx;
  // Pull up to three short feature lines from the caption (newline-split or
  // sentence-split). Caps each at ~48 chars so they fit the layout.
  const parts = caption
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((s) => (s.length > 56 ? s.slice(0, 53) + "…" : s));
  return (
    <SlideFrame ctx={ctx} slideNum={slideNum}>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          marginTop: 30,
          gap: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              color: seg.accent,
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
          {parts.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 14,
                  height: 14,
                  backgroundColor: seg.accent,
                  borderRadius: 3,
                  marginTop: 12,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  lineHeight: 1.3,
                  fontWeight: 600,
                  color: bg.text,
                }}
              >
                {p}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexShrink: 0 }}>
          <Phone shot={shot} width={360} glow={seg.accent} objectPosition={objectPosition} />
        </div>
      </div>
    </SlideFrame>
  );
}

// ─── Slide 5: CTA ────────────────────────────────────────────────────────────
function SlideCTA({
  ctx,
  projectName,
  projectUrl,
}: {
  ctx: Ctx;
  projectName: string;
  projectUrl: string;
}) {
  const { seg, bg } = ctx;
  const cleanUrl = projectUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const pillBg = bg.theme === "light" ? seg.accent : "#FFFFFF";
  const pillFg = bg.theme === "light" ? "#FFFFFF" : "#14243F";
  return (
    <SlideFrame ctx={ctx} slideNum={5}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            color: seg.accent,
            fontSize: 28,
            letterSpacing: 10,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {`[ Try it now ]`}
        </div>
        <div
          style={{
            display: "flex",
            color: bg.text,
            fontSize: 130,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -3,
            marginTop: 8,
          }}
        >
          {`${projectName} →`}
        </div>
        <div
          style={{
            display: "flex",
            padding: "22px 44px",
            backgroundColor: pillBg,
            color: pillFg,
            borderRadius: 100,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: -0.5,
            marginTop: 16,
          }}
        >
          {cleanUrl}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: bg.textDim,
            lineHeight: 1.4,
            maxWidth: 760,
            marginTop: 36,
            textAlign: "center",
          }}
        >
          {`Built by a CODED ${seg.label} grad. Want to build like this? Link in bio.`}
        </div>
      </div>
    </SlideFrame>
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const all = await listSubmissions();
  const s = all.find((x) => x.id === id);
  if (!s) return new Response("Not found", { status: 404 });

  try {
    const seg = getSegment(s.segment);
    const bg = brandBg(seg);

    // Pre-bake the AI App Developer lockup PNG as a data URL so Satori can
    // embed it directly. Cheap (~30 KB) and only matters for this segment.
    const aiLockup =
      seg.key === "ai-app-developer"
        ? await fileDataUrl("brand/ai-app-developer-white.png", "image/png")
        : undefined;

    const shotBuf = await getOrFetchShot(id, s.url);
    const meta = await sharp(shotBuf).metadata();
    const shotW = meta.width ?? 780;
    const shotH = meta.height ?? 1688;

    const [heroShot, midShot, bottomShot] = await Promise.all([
      cropAtScroll(shotBuf, 0.0, shotW, shotH),
      cropAtScroll(shotBuf, 0.4, shotW, shotH),
      cropAtScroll(shotBuf, 0.85, shotW, shotH),
    ]);

    const pitchLine = s.pitch.length > 140 ? s.pitch.slice(0, 137) + "…" : s.pitch;

    const ctx: Ctx = {
      bg,
      seg,
      segmentKey: seg.key,
      aiLockup,
    };

    const slides = [
      <SlideCover key="1" ctx={ctx} headline={s.headline} shot={heroShot} />,
      <SlideMeet key="2" ctx={ctx} projectName={s.name} pitch={pitchLine} />,
      <SlideAction
        key="3"
        ctx={ctx}
        shot={midShot}
        caption={s.caption}
        eyebrow="In action"
        slideNum={3}
        objectPosition="top"
      />,
      <SlideAction
        key="4"
        ctx={ctx}
        shot={bottomShot}
        caption={s.caption}
        eyebrow="And more"
        slideNum={4}
        objectPosition="bottom"
      />,
      <SlideCTA key="5" ctx={ctx} projectName={s.name} projectUrl={s.url} />,
    ];

    const slideBuffers = await Promise.all(
      slides.map(async (el) => {
        const res = new ImageResponse(el, { width: W, height: H });
        return Buffer.from(await res.arrayBuffer());
      }),
    );

    const safeName = s.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const zip = new JSZip();
    slideBuffers.forEach((buf, i) => {
      zip.file(`${safeName || "post"}-coded-${i + 1}.png`, buf);
    });
    const zipBuf = await zip.generateAsync({ type: "uint8array" });

    return new Response(new Uint8Array(zipBuf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName || "post"}-coded-carousel.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "carousel render failed";
    console.error("Carousel render failed:", e);
    return new Response(msg, { status: 500 });
  }
}
