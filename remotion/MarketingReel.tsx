import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const REEL_FPS = 30;
export const REEL_DURATION_FRAMES = 900; // 30 seconds

export const marketingReelSchema = z.object({
  headline: z.string(),
  projectName: z.string(),
  segmentLabel: z.string(),
  logoDataUrl: z.string(),
  shotDataUrl: z.string(),
  shotWidth: z.number(),
  shotHeight: z.number(),
  bgBase: z.string(),
  bgAccent: z.string(),
  bgGradient: z.string(),
  bgOverlay: z.string(),
  segAccent: z.string(),
});

const PHONE_W = 460;
const PHONE_H = 1000;
const APERTURE_INSET = 12;
const APERTURE_W = PHONE_W - APERTURE_INSET * 2;
const APERTURE_H = PHONE_H - APERTURE_INSET * 2;

// Tap ripple animation — expanding ring with fading opacity
const TapRipple: React.FC<{ x: number; y: number; startFrame: number }> = ({
  x,
  y,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > 30) return null;
  const progress = local / 30;
  const size = interpolate(progress, [0, 1], [20, 200]);
  const opacity = interpolate(progress, [0, 0.2, 1], [0, 0.9, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        border: "4px solid rgba(255,255,255,0.95)",
        boxShadow: "0 0 30px rgba(98,255,229,0.6)",
        opacity,
      }}
    />
  );
};

export const MarketingReel: React.FC<
  z.infer<typeof marketingReelSchema>
> = ({
  headline,
  projectName,
  segmentLabel,
  logoDataUrl,
  shotDataUrl,
  shotWidth,
  shotHeight,
  bgBase,
  bgGradient,
  bgOverlay,
  segAccent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Background pulse ---
  const glowPulse = 0.85 + 0.15 * Math.sin((frame / fps) * Math.PI * 0.4);

  // --- Logo: fade + drift in (0–1s) ---
  const logoOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(frame, [10, 40], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Eyebrow: spring up (1–2s) ---
  const eyebrowProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const eyebrowY = interpolate(eyebrowProgress, [0, 1], [30, 0]);
  const eyebrowOpacity = interpolate(eyebrowProgress, [0, 1], [0, 1]);

  // --- Headline: word-by-word (1.3–2.5s) ---
  const words = headline.split(" ");
  const headlineStart = 40;
  const wordGap = 4;

  // --- Phone: spring up from bottom (2–4s) ---
  const phoneProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });
  const phoneY = interpolate(phoneProgress, [0, 1], [700, 0]);
  const phoneOpacity = interpolate(phoneProgress, [0, 1], [0, 1]);

  // --- Screenshot scroll math ---
  // Fit screenshot width to aperture width, scale height proportionally.
  const imgScale = APERTURE_W / shotWidth;
  const imgDisplayHeight = shotHeight * imgScale;
  const scrollDistance = Math.max(0, imgDisplayHeight - APERTURE_H);

  // Scroll happens between f120 (4s) and f720 (24s). Cosine-ease for smooth feel.
  const scrollStart = 120;
  const scrollEnd = 720;
  const scrollRaw = interpolate(frame, [scrollStart, scrollEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scrollEased = 0.5 - 0.5 * Math.cos(scrollRaw * Math.PI);
  const screenshotY = -scrollEased * scrollDistance;

  // --- Final CTA tag: fade in (27.5–29s) ---
  const ctaOpacity = interpolate(frame, [825, 870], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgBase,
        fontFamily: "sans-serif",
        color: "#FFFFFF",
      }}
    >
      {/* Segment-branded gradient background */}
      <AbsoluteFill
        style={{
          backgroundImage: bgGradient,
          opacity: glowPulse,
        }}
      />
      {/* Optional second-layer brand overlay (per-segment) */}
      {bgOverlay && (
        <AbsoluteFill
          style={{
            backgroundImage: bgOverlay,
            opacity: glowPulse,
          }}
        />
      )}

      {/* Foreground content stack */}
      <AbsoluteFill style={{ padding: "70px 60px", display: "flex" }}>
        {/* Logo */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
          }}
        >
          <Img src={logoDataUrl} style={{ width: 320, height: "auto" }} />
        </div>

        {/* Eyebrow */}
        <div
          style={{
            marginTop: 40,
            fontSize: 30,
            color: segAccent,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontWeight: 600,
            opacity: eyebrowOpacity,
            transform: `translateY(${eyebrowY}px)`,
          }}
        >
          Built with AI · {segmentLabel}
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 18,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1,
            display: "flex",
            flexWrap: "wrap",
            gap: "0 18px",
          }}
        >
          {words.map((w, i) => {
            const wordStart = headlineStart + i * wordGap;
            const wp = spring({
              frame: frame - wordStart,
              fps,
              config: { damping: 16, stiffness: 130 },
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: interpolate(wp, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(wp, [0, 1], [40, 0])}px)`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Phone mockup */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <div
            style={{
              position: "relative",
              width: PHONE_W,
              height: PHONE_H,
              backgroundColor: "#000",
              borderRadius: 80,
              padding: APERTURE_INSET,
              display: "flex",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
              opacity: phoneOpacity,
              transform: `translateY(${phoneY}px)`,
            }}
          >
            {/* Aperture */}
            <div
              style={{
                position: "relative",
                width: APERTURE_W,
                height: APERTURE_H,
                borderRadius: 68,
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
                display: "flex",
              }}
            >
              <Img
                src={shotDataUrl}
                style={{
                  width: APERTURE_W,
                  height: imgDisplayHeight,
                  display: "block",
                  transform: `translateY(${screenshotY}px)`,
                }}
              />
              {/* Dynamic island */}
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
                }}
              />

              {/* Tap ripples — positioned within aperture coordinates */}
              <TapRipple x={APERTURE_W * 0.5} y={APERTURE_H * 0.78} startFrame={240} />
              <TapRipple x={APERTURE_W * 0.5} y={APERTURE_H * 0.55} startFrame={450} />
              <TapRipple x={APERTURE_W * 0.5} y={APERTURE_H * 0.70} startFrame={660} />

              {/* Final CTA chip pinned to bottom of aperture */}
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  right: 24,
                  bottom: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 18px",
                  backgroundColor: "rgba(255,255,255,0.95)",
                  color: "#14243F",
                  borderRadius: 50,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 1,
                  opacity: ctaOpacity,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                }}
              >
                Try {projectName} →
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginTop: 30,
            opacity: interpolate(frame, [60, 110], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div>coded.kw</div>
          <div>@coded.kw</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
