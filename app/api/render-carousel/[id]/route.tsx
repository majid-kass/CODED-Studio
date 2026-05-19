import { ImageResponse } from "next/og";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import JSZip from "jszip";
import { listSubmissions } from "@/lib/store";
import { microlinkUrl, readCachedShot, writeCachedShot } from "@/lib/screenshot";
import { brandBg, getSegment, type BgTreatment, type SegmentPalette } from "@/lib/brandTheme";

export const runtime = "nodejs";

// Instagram carousel slides are 1080×1350 (4:5 portrait, the IG-recommended ratio).
const W = 1080;
const H = 1350;

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

// Crop a vertical phone-aspect window from the full-page screenshot at a given
// scroll offset (0..1, where 0 is top of page, 1 is bottom).
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

type SlideAssets = {
  logo: string;
  hero: string;
  middle: string;
  bottom: string;
};

function bgStyle(bg: BgTreatment) {
  return {
    width: W,
    height: H,
    display: "flex" as const,
    flexDirection: "column" as const,
    backgroundColor: bg.base,
    backgroundImage: bg.cssOverlay ? `${bg.cssOverlay}, ${bg.cssGradient}` : bg.cssGradient,
    color: "#FFFFFF",
    fontFamily: "sans-serif",
    padding: "60px 60px",
  };
}

function Slide1Hero({
  bg,
  seg,
  headline,
  assets,
}: {
  bg: BgTreatment;
  seg: SegmentPalette;
  headline: string;
  assets: SlideAssets;
}) {
  return (
    <div style={bgStyle(bg)}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assets.logo} width={300} height={104} alt="" />
        <div
          style={{
            fontSize: 26,
            color: seg.accent,
            letterSpacing: 7,
            textTransform: "uppercase",
            marginTop: 30,
            fontWeight: 600,
          }}
        >
          {`Built with AI · ${seg.label}`}
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 14,
            letterSpacing: -1,
          }}
        >
          {headline}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 380,
            height: 820,
            backgroundColor: "#000",
            borderRadius: 64,
            padding: 10,
            boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              borderRadius: 54,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assets.hero}
              alt=""
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 5,
          textTransform: "uppercase",
          marginTop: 20,
        }}
      >
        <div>coded.kw</div>
        <div>1 / 5 →</div>
      </div>
    </div>
  );
}

function SlideName({
  bg,
  seg,
  projectName,
  pitch,
  assets,
  slideNum,
}: {
  bg: BgTreatment;
  seg: SegmentPalette;
  projectName: string;
  pitch: string;
  assets: SlideAssets;
  slideNum: number;
}) {
  return (
    <div style={bgStyle(bg)}>
      <div style={{ display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assets.logo} width={240} height={84} alt="" />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: seg.accent,
            letterSpacing: 7,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          Meet
        </div>
        <div
          style={{
            fontSize: 140,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {projectName}
        </div>
        <div
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.85)",
            marginTop: 30,
            lineHeight: 1.3,
            fontWeight: 500,
          }}
        >
          {pitch}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 5,
          textTransform: "uppercase",
        }}
      >
        <div>coded.kw</div>
        <div>{`${slideNum} / 5 →`}</div>
      </div>
    </div>
  );
}

function SlidePhone({
  bg,
  seg,
  caption,
  screenshot,
  slideNum,
  assets,
}: {
  bg: BgTreatment;
  seg: SegmentPalette;
  caption: string;
  screenshot: string;
  slideNum: number;
  assets: SlideAssets;
}) {
  return (
    <div style={bgStyle(bg)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assets.logo} width={220} height={76} alt="" />
        <div
          style={{
            fontSize: 22,
            color: seg.accent,
            letterSpacing: 5,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          In Action
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          gap: 50,
          marginTop: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 380,
            height: 820,
            backgroundColor: "#000",
            borderRadius: 64,
            padding: 10,
            boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              borderRadius: 54,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshot}
              alt=""
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.35,
            fontWeight: 500,
            flex: 1,
          }}
        >
          {caption}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 5,
          textTransform: "uppercase",
        }}
      >
        <div>coded.kw</div>
        <div>{`${slideNum} / 5 →`}</div>
      </div>
    </div>
  );
}

function SlideCTA({
  bg,
  seg,
  projectName,
  projectUrl,
  assets,
}: {
  bg: BgTreatment;
  seg: SegmentPalette;
  projectName: string;
  projectUrl: string;
  assets: SlideAssets;
}) {
  const cleanUrl = projectUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div style={bgStyle(bg)}>
      <div style={{ display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assets.logo} width={240} height={84} alt="" />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: seg.accent,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 30,
          }}
        >
          {`Try it now · ${seg.label}`}
        </div>
        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -2,
            marginBottom: 30,
          }}
        >
          {`${projectName} →`}
        </div>
        <div
          style={{
            display: "flex",
            padding: "20px 36px",
            border: "2px solid rgba(255,255,255,0.4)",
            borderRadius: 50,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {cleanUrl}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.65)",
            marginTop: 50,
            maxWidth: 720,
            lineHeight: 1.4,
          }}
        >
          {`Built by a CODED ${seg.label} grad. Want to build like this? Link in bio.`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 5,
          textTransform: "uppercase",
        }}
      >
        <div>coded.kw</div>
        <div>5 / 5</div>
      </div>
    </div>
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

    const [logoDataUrl, shotBuf] = await Promise.all([
      fileDataUrl("brand/coded-logo-white.png", "image/png"),
      getOrFetchShot(id, s.url),
    ]);

    const meta = await sharp(shotBuf).metadata();
    const shotW = meta.width ?? 780;
    const shotH = meta.height ?? 1688;

    // Three different scroll positions for the phone slides.
    const [heroShot, midShot, bottomShot] = await Promise.all([
      cropAtScroll(shotBuf, 0.0, shotW, shotH),
      cropAtScroll(shotBuf, 0.4, shotW, shotH),
      cropAtScroll(shotBuf, 0.85, shotW, shotH),
    ]);

    const assets: SlideAssets = {
      logo: logoDataUrl,
      hero: heroShot,
      middle: midShot,
      bottom: bottomShot,
    };

    // Split caption into a short pitch line for slide 2.
    const pitchLine = s.pitch.length > 120 ? s.pitch.slice(0, 117) + "…" : s.pitch;

    // Pull a short evocative line from the caption for slide 3 / slide 4.
    const captionLines = s.caption.split("\n").filter((l) => l.trim().length > 0);
    const midCaption = captionLines[1] ?? captionLines[0] ?? "Built with AI. Shipped fast.";
    const bottomCaption =
      captionLines[2] ?? captionLines[captionLines.length - 1] ?? "Real product. Real users.";

    const slides = [
      <Slide1Hero key="1" bg={bg} seg={seg} headline={s.headline} assets={assets} />,
      <SlideName key="2" bg={bg} seg={seg} projectName={s.name} pitch={pitchLine} assets={assets} slideNum={2} />,
      <SlidePhone key="3" bg={bg} seg={seg} caption={midCaption} screenshot={midShot} slideNum={3} assets={assets} />,
      <SlidePhone key="4" bg={bg} seg={seg} caption={bottomCaption} screenshot={bottomShot} slideNum={4} assets={assets} />,
      <SlideCTA key="5" bg={bg} seg={seg} projectName={s.name} projectUrl={s.url} assets={assets} />,
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
