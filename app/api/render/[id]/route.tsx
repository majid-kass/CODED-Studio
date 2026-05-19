import { ImageResponse } from "next/og";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { listSubmissions } from "@/lib/store";
import { microlinkUrl, readCachedShot, writeCachedShot } from "@/lib/screenshot";
import { brandBg, getSegment } from "@/lib/brandTheme";
import { SegmentLogo } from "@/components/SegmentLogo";

export const runtime = "nodejs";

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

  const seg = getSegment(s.segment);
  const bg = brandBg(seg);

  const aiLockup =
    seg.key === "ai-app-developer"
      ? await fileDataUrl("brand/ai-app-developer-white.png", "image/png")
      : undefined;

  const shotBuf = await getOrFetchShot(id, s.url);
  const meta = await sharp(shotBuf).metadata();

  // Crop the screenshot to a phone-aspect hero window (top of page).
  const w = meta.width ?? 780;
  const h = meta.height ?? 1688;
  const cropAspect = 9 / 19.5;
  const cropW = w;
  const cropH = Math.min(h, Math.round(w / cropAspect));
  const heroBuf = await sharp(shotBuf)
    .extract({ left: 0, top: 0, width: cropW, height: cropH })
    .png()
    .toBuffer();
  const shotDataUrl = bufferToDataUrl(heroBuf);

  const safeName = s.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Phone geometry — drawn at the size that anchors the composition.
  const PHONE_W = 480;
  const PHONE_H = Math.round(PHONE_W * (19.5 / 9));
  const PHONE_INSET = 14;
  const PHONE_RADIUS = 90;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          backgroundColor: bg.base,
          backgroundImage: bg.cssOverlay
            ? `${bg.cssOverlay}, ${bg.cssGradient}`
            : bg.cssGradient,
          color: bg.text,
          fontFamily: "sans-serif",
          padding: "80px 80px",
          position: "relative",
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
            width={340}
            segment={seg.key}
            aiAppDeveloperDataUrl={aiLockup}
            color={bg.text}
          />
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 8,
              color: bg.textDim,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Showcase
          </div>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 56,
            color: seg.accent,
            fontSize: 30,
            letterSpacing: 10,
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
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -2,
            marginTop: 22,
            maxWidth: 900,
          }}
        >
          {s.headline}
        </div>

        {/* Phone */}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: PHONE_W,
              height: PHONE_H,
              backgroundColor: "#0a0a0a",
              borderRadius: PHONE_RADIUS,
              padding: PHONE_INSET,
              boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 80px ${seg.accent}55`,
            }}
          >
            <div
              style={{
                display: "flex",
                position: "relative",
                flex: 1,
                borderRadius: PHONE_RADIUS - PHONE_INSET / 2,
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shotDataUrl}
                alt={s.name}
                width={PHONE_W - PHONE_INSET * 2}
                height={PHONE_H - PHONE_INSET * 2}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 130,
                  height: 32,
                  backgroundColor: "#000",
                  borderRadius: 18,
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: PHONE_H * 0.18,
                  display: "flex",
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: bg.textDim,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginTop: 30,
          }}
        >
          <div style={{ display: "flex" }}>coded.kw</div>
          <div style={{ display: "flex" }}>@coded.kw</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        "Content-Disposition": `attachment; filename="${safeName || "post"}-coded.png"`,
        "Cache-Control": "no-store",
      },
    }
  );
}

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
  const size = 180;
  const stroke = 8;
  const off = 40;
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
