import { ImageResponse } from "next/og";
import sharp from "sharp";
import { listSubmissions } from "@/lib/store";
import { microlinkUrl, readCachedShot, writeCachedShot } from "@/lib/screenshot";
import { brandBg, getSegment } from "@/lib/brandTheme";
import { CodedLogo } from "@/components/CodedLogo";

export const runtime = "nodejs";

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
          color: "#FFFFFF",
          fontFamily: "sans-serif",
          padding: "70px 60px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <CodedLogo width={320} />
          <div
            style={{
              fontSize: 28,
              color: seg.accent,
              letterSpacing: 8,
              textTransform: "uppercase",
              marginTop: 36,
              fontWeight: 600,
            }}
          >
            {`Built with AI · ${seg.label}`}
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
              marginTop: 18,
              letterSpacing: -1,
            }}
          >
            {s.headline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 460,
              height: 1000,
              backgroundColor: "#000",
              borderRadius: 80,
              padding: 12,
              boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
            }}
          >
            <div
              style={{
                display: "flex",
                flex: 1,
                borderRadius: 68,
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shotDataUrl}
                width={436}
                height={976}
                alt={s.name}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 110,
                  height: 28,
                  backgroundColor: "#000",
                  borderRadius: 14,
                  display: "flex",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginTop: 30,
          }}
        >
          <div>coded.kw</div>
          <div>@coded.kw</div>
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
