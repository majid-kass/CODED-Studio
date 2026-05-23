import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { SegmentLogo } from "../components/SegmentLogo";
import type { SegmentKey } from "../lib/brandTheme";

export const REEL_FPS = 30;
export const REEL_DURATION_FRAMES = 600; // 20s

export const marketingReelSchema = z.object({
  headline: z.string(),
  projectName: z.string(),
  segmentKey: z.string(),
  segmentLabel: z.string(),
  aiLockup: z.string(),
  shotDataUrl: z.string(),
  shotWidth: z.number(),
  shotHeight: z.number(),
  bgBase: z.string(),
  bgAccent: z.string(),
  bgGradient: z.string(),
  bgOverlay: z.string(),
  segAccent: z.string(),
  theme: z.enum(["light", "dark"]),
  textColor: z.string(),
  textDimColor: z.string(),
  features: z.array(z.string()),
  /** "phone" → portrait mockup with tilt + scroll motion (default).
      "laptop" → static landscape mockup that holds center (no tilt, no
      scale-to-side) so the Reel scene structure still works without a
      redesign. */
  mockup: z.enum(["phone", "laptop"]),
  /** Sequence of viewport-sized screenshots from a real Playwright walkthrough
      (landing page → up to 4 internal pages). When non-empty the Reel cuts
      between these on each tap instead of scrolling one long screenshot. */
  walkthroughFrames: z.array(z.string()),
  /** Whether the headline/CTA copy is right-to-left (Arabic) so we can flip
      element direction and tweak text alignment. */
  isRtl: z.boolean(),
});

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PHONE_W = 460;
const PHONE_H = 1000;
const APERTURE_INSET = 12;
const APERTURE_W = PHONE_W - APERTURE_INSET * 2;
const APERTURE_H = PHONE_H - APERTURE_INSET * 2;

// ─────────────────────────────────────────────────────────────────────────────
// Scene timing — drives every transform. Adjust here, not inside components.
// Each scene roughly 1/6 of the 20-second total (600 frames @ 30 fps):
// 0–2s    SCENE 1   brand intro
// 2–6s    SCENE 2   phone reveal portrait + tap demo
// 6–10s   SCENE 3   phone tilts sideways + stat badges fly in
// 10–14s  SCENE 4   phone back upright + more taps + segment infographic
// 14–17s  SCENE 5   infographic moment (phone shrinks, stats dominate)
// 17–20s  SCENE 6   CTA outro
const SCENES = {
  intro: [0, 60],
  reveal: [60, 180],
  sideways: [180, 300],
  upright: [300, 420],
  infographic: [420, 510],
  cta: [510, 600],
} as const;

// Helper: stable progress from [a..b], clamped 0..1.
function ramp(frame: number, a: number, b: number) {
  return interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating icon — small accent shape that springs in, drifts, fades out.
// Decorative; positioned in canvas coords (not aperture).
type FloatingIconProps = {
  glyph: string;
  x: number;
  y: number;
  size: number;
  start: number;
  duration?: number;
  color: string;
  drift?: { dx: number; dy: number };
};
const FloatingIcon: React.FC<FloatingIconProps> = ({
  glyph,
  x,
  y,
  size,
  start,
  duration = 80,
  color,
  drift = { dx: 0, dy: -40 },
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  if (local < -2 || local > duration + 30) return null;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 10, stiffness: 140, mass: 0.6 },
  });
  const exit = interpolate(local, [duration, duration + 25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(enter, [0, 1], [0.2, 1]);
  const driftP = interpolate(local, [0, duration + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = enter * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: x + drift.dx * driftP - size / 2,
        top: y + drift.dy * driftP - size / 2,
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.7,
        color,
        textShadow: `0 0 ${size * 0.6}px ${color}`,
        opacity,
        transform: `scale(${scale})`,
        fontWeight: 800,
      }}
    >
      {glyph}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat badge — pill with icon + number + label. Springs in, holds, springs out.
const StatBadge: React.FC<{
  glyph: string;
  value: string;
  label: string;
  x: number;
  y: number;
  start: number;
  duration: number;
  accent: string;
}> = ({ glyph, value, label, x, y, start, duration, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  if (local < -2 || local > duration + 20) return null;

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 130, mass: 0.7 },
  });
  const exit = interpolate(local, [duration, duration + 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const opacity = enter * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 24px 16px 18px",
        backgroundColor: "rgba(255,255,255,0.96)",
        color: "#14243F",
        borderRadius: 100,
        boxShadow: `0 16px 40px rgba(0,0,0,0.35), 0 0 30px ${accent}50`,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          borderRadius: "50%",
          backgroundColor: accent,
          color: "#FFFFFF",
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        {glyph}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: label ? 28 : 30,
            fontWeight: 800,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {value}
        </div>
        {label && (
          <div
            style={{
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#14243F99",
              marginTop: 4,
              display: "flex",
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tap feedback — ripple + finger dot for "the user just tapped" beat.
const TapRipple: React.FC<{ x: number; y: number; start: number }> = ({
  x,
  y,
  start,
}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  if (local < 0 || local > 28) return null;
  const p = local / 28;
  const size = interpolate(p, [0, 1], [16, 220]);
  const opacity = interpolate(p, [0, 0.15, 1], [0, 0.95, 0]);
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
        opacity,
      }}
    />
  );
};
const TapDot: React.FC<{ x: number; y: number; start: number }> = ({
  x,
  y,
  start,
}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  if (local < -4 || local > 14) return null;
  const opacity = interpolate(local, [-4, 0, 10, 14], [0, 0.9, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(local, [-4, 0, 6], [1.4, 1.0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x - 14,
        top: y - 14,
        width: 28,
        height: 28,
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.85)",
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Device — phone or laptop frame. In walkthrough mode the inner image cuts
// between captured pages (objectFit: cover, no translate). In scroll mode it
// renders the single long screenshot with a translateY for paged scroll.
type DeviceProps = {
  mockup: "phone" | "laptop";
  shotDataUrl: string;
  imgHeight: number;
  scrollY: number;
  walkMode: boolean;
  apertureW: number;
  apertureH: number;
  taps?: { x: number; y: number; start: number }[];
};

const Device: React.FC<DeviceProps> = ({
  mockup,
  shotDataUrl,
  imgHeight,
  scrollY,
  walkMode,
  apertureW,
  apertureH,
  taps = [],
}) => {
  if (mockup === "laptop") {
    const frameW = apertureW + 28;
    const frameH = apertureH + 28;
    const baseW = Math.round(frameW * 1.07);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: frameW,
            height: frameH,
            backgroundColor: "#0a0a0a",
            borderRadius: 22,
            padding: 14,
            display: "flex",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: apertureW,
              height: apertureH,
              borderRadius: 10,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              display: "flex",
            }}
          >
            {walkMode ? (
              <Img
                src={shotDataUrl}
                style={{
                  width: apertureW,
                  height: apertureH,
                  display: "block",
                  objectFit: "cover",
                  objectPosition: "top",
                }}
              />
            ) : (
              <Img
                src={shotDataUrl}
                style={{
                  width: apertureW,
                  height: imgHeight,
                  display: "block",
                  transform: `translateY(${scrollY}px)`,
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 8,
                height: 8,
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: 999,
                display: "flex",
              }}
            />
            {taps.map((t, i) => (
              <span key={i}>
                <TapRipple x={t.x} y={t.y} start={t.start} />
                <TapDot x={t.x} y={t.y} start={t.start} />
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: baseW,
            height: 24,
            marginTop: 3,
            backgroundImage:
              "linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 40%, #0a0a0a 100%)",
            borderRadius: `0 0 24px 24px`,
          }}
        />
      </div>
    );
  }

  // Phone
  return (
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
      }}
    >
      <div
        style={{
          position: "relative",
          width: apertureW,
          height: apertureH,
          borderRadius: 68,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          display: "flex",
        }}
      >
        {walkMode ? (
          <Img
            src={shotDataUrl}
            style={{
              width: apertureW,
              height: apertureH,
              display: "block",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        ) : (
          <Img
            src={shotDataUrl}
            style={{
              width: apertureW,
              height: imgHeight,
              display: "block",
              transform: `translateY(${scrollY}px)`,
            }}
          />
        )}
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
        {taps.map((t, i) => (
          <span key={i}>
            <TapRipple x={t.x} y={t.y} start={t.start} />
            <TapDot x={t.x} y={t.y} start={t.start} />
          </span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: page navigation — given a scroll distance and a list of scroll
// fractions [0..1], produce per-frame scroll position with spring transitions
// at the supplied jump frames.
function navScroll(
  frame: number,
  fps: number,
  scrollDistance: number,
  stops: { at: number; t: number; jumpFrames: number }[]
) {
  if (stops.length === 0) return 0;
  let current = -scrollDistance * stops[0].t;
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const next = stops[i + 1];
    const end = s.at + s.jumpFrames;
    if (frame < s.at) break;
    if (!next || frame < s.at) {
      current = -scrollDistance * s.t;
      continue;
    }
    if (frame < end) {
      const jp = spring({
        frame: frame - s.at,
        fps,
        durationInFrames: s.jumpFrames,
        config: { damping: 16, stiffness: 200, mass: 0.7 },
      });
      current = interpolate(jp, [0, 1], [-scrollDistance * s.t, -scrollDistance * next.t]);
      break;
    }
    current = -scrollDistance * next.t;
  }
  return current;
}

// ─────────────────────────────────────────────────────────────────────────────
export const MarketingReel: React.FC<
  z.infer<typeof marketingReelSchema>
> = ({
  headline,
  projectName,
  segmentKey,
  segmentLabel,
  aiLockup,
  shotDataUrl,
  shotWidth,
  shotHeight,
  bgBase,
  bgGradient,
  bgOverlay,
  segAccent,
  textColor,
  textDimColor,
  features,
  mockup,
  walkthroughFrames,
  isRtl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Background pulse / breathing ────────────────────────────────────────
  const glowPulse = 0.82 + 0.18 * Math.sin((frame / fps) * Math.PI * 0.5);

  // ── Header (logo + eyebrow + headline) lives across scenes 1+2 ──────────
  const logoOpacity = ramp(frame, 10, 40);
  const logoY = interpolate(frame, [10, 40], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const eyebrowSpring = spring({
    frame: frame - 28,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const eyebrowOpacity = interpolate(eyebrowSpring, [0, 1], [0, 1]);
  const eyebrowY = interpolate(eyebrowSpring, [0, 1], [30, 0]);

  // Headline shows during intro + reveal, fades during sideways scene.
  const headlineAppear = ramp(frame, 40, 80);
  const headlineFade = interpolate(frame, [SCENES.sideways[0] - 20, SCENES.sideways[0] + 30], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineGate = headlineAppear * headlineFade;

  // ── Phone reveal: enter from bottom at scene 2 start ────────────────────
  const phoneEnter = spring({
    frame: frame - SCENES.reveal[0],
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });
  const phoneEnterY = interpolate(phoneEnter, [0, 1], [800, 0]);
  const phoneEnterOpacity = interpolate(phoneEnter, [0, 1], [0, 1]);

  // ── Phone transforms per scene ──────────────────────────────────────────
  // Scene 2 reveal:    phone center, upright, big
  // Scene 3 sideways:  phone tilts to ~-14° and shifts left to make room
  // Scene 4 upright:   tilt resolves back to 0, returns to center
  // Scene 5 infographic: phone shrinks (~0.75) and slides right
  // Scene 6 cta:       phone returns to center, scale 0.9

  const isLaptop = mockup === "laptop";

  const t3 = ramp(frame, SCENES.sideways[0] - 10, SCENES.sideways[0] + 30);
  const t3End = ramp(frame, SCENES.upright[0] - 20, SCENES.upright[0] + 30);
  // Laptop never tilts (the 14° rotation doesn't read on a landscape device);
  // we keep the phone motion intact when mockup === "phone".
  const tiltDeg = isLaptop ? 0 : interpolate(t3 - t3End, [0, 1], [0, -14]);
  const sidewaysShiftX = isLaptop ? 0 : interpolate(t3 - t3End, [0, 1], [0, -90]);

  const t5 = ramp(frame, SCENES.infographic[0] - 20, SCENES.infographic[0] + 30);
  const t5End = ramp(frame, SCENES.cta[0] - 30, SCENES.cta[0] + 10);
  const t5Net = Math.max(0, t5 - t5End);
  // Laptop also skips the scene-5 shrink-and-slide-right since it occupies the
  // canvas width differently — it just stays centered.
  const shrink = isLaptop ? 1 : interpolate(t5Net, [0, 1], [1, 0.62]);
  const shrinkShiftX = isLaptop ? 0 : interpolate(t5Net, [0, 1], [0, 220]);

  // CTA scene: pull the device up and shrink it so the CTA pill has clear
  // air below — previously the "Try {project} →" pill overlapped the phone
  // bottom bezel.
  const t6 = ramp(frame, SCENES.cta[0] - 20, SCENES.cta[0] + 30);
  const ctaScale = interpolate(t6, [0, 1], [1, 0.7]);
  const ctaShiftY = interpolate(t6, [0, 1], [0, -130]);

  const finalScale = shrink * ctaScale;
  const finalShiftX = sidewaysShiftX + shrinkShiftX;
  const finalShiftY = phoneEnterY + ctaShiftY;
  const phoneTransform = `translate(${finalShiftX}px, ${finalShiftY}px) rotate(${tiltDeg}deg) scale(${finalScale})`;

  // ── App navigation: cut between Playwright walkthrough frames on tap ────
  // If we have multiple captured pages, each "stop" shows the next page —
  // a real click-through of the app. With zero or one frame, fall back to
  // tap-paged scroll positions on the single long-page screenshot.
  const useWalk = walkthroughFrames && walkthroughFrames.length > 1;

  // Mockup geometry — phone vs laptop. Phone keeps the existing 9:19.5
  // aperture; laptop is a wider 16:10 panel anchored center.
  const apertureW = isLaptop ? 880 : APERTURE_W;
  const apertureH = isLaptop ? Math.round(apertureW / (16 / 10)) : APERTURE_H;

  const imgScale = apertureW / shotWidth;
  const imgDisplayHeight = shotHeight * imgScale;
  const scrollDistance = useWalk ? 0 : Math.max(0, imgDisplayHeight - apertureH);

  const navStart = SCENES.reveal[0] + 30;
  const navEnd = SCENES.upright[1] - 20;
  const stopCount = useWalk
    ? Math.min(walkthroughFrames.length, 5)
    : 5;
  const stopGap = Math.floor((navEnd - navStart) / stopCount);
  // Each stop's scroll fraction is evenly spaced when in scroll fallback
  // mode; in walkthrough mode the scroll is moot (we cut images instead).
  const stops = Array.from({ length: stopCount }, (_, i) => ({
    at: navStart + i * stopGap,
    t: stopCount === 1 ? 0 : i / (stopCount - 1),
    jumpFrames: 16,
    frameIndex: i,
  }));
  const screenshotY = navScroll(frame, fps, scrollDistance, stops);

  // Walkthrough mode: figure out which captured page should be on screen
  // right now. Cuts happen at `at + jumpFrames` so the tap ripple's impact
  // visually advances the page.
  let currentFrameIndex = 0;
  for (const s of stops) {
    if (frame >= s.at + s.jumpFrames) currentFrameIndex = s.frameIndex;
  }
  const currentFrameSrc = useWalk
    ? walkthroughFrames[Math.min(currentFrameIndex, walkthroughFrames.length - 1)]
    : shotDataUrl;

  const tapTargets: [number, number][] = isLaptop
    ? [
        [apertureW * 0.7, apertureH * 0.5],
        [apertureW * 0.2, apertureH * 0.7],
        [apertureW * 0.55, apertureH * 0.35],
        [apertureW * 0.85, apertureH * 0.65],
      ]
    : [
        [apertureW * 0.5, apertureH * 0.72],
        [apertureW * 0.78, apertureH * 0.22],
        [apertureW * 0.5, apertureH * 0.5],
        [apertureW * 0.32, apertureH * 0.66],
      ];
  const taps = stops.slice(0, -1).map((s, i) => ({
    x: tapTargets[i % tapTargets.length][0],
    y: tapTargets[i % tapTargets.length][1],
    start: s.at - 18,
  }));

  // ── CTA (Try {project} →) — visible only in cta scene ──────────────────
  const ctaOpacity = ramp(frame, SCENES.cta[0], SCENES.cta[0] + 30);

  // ── Words for headline animation ────────────────────────────────────────
  const words = headline.split(" ");
  const headlineStart = 40;
  const wordGap = 4;

  // ── Big infographic block during scene 5 ────────────────────────────────
  const infoOpacity = ramp(frame, SCENES.infographic[0], SCENES.infographic[0] + 25);
  const infoFade = interpolate(
    frame,
    [SCENES.cta[0] - 15, SCENES.cta[0] + 20],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const infoGate = infoOpacity * infoFade;
  const infoSlide = interpolate(ramp(frame, SCENES.infographic[0], SCENES.infographic[0] + 30), [0, 1], [60, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgBase,
        fontFamily: "sans-serif",
        color: textColor,
      }}
    >
      <AbsoluteFill style={{ backgroundImage: bgGradient, opacity: glowPulse }} />
      {bgOverlay && (
        <AbsoluteFill style={{ backgroundImage: bgOverlay, opacity: glowPulse }} />
      )}

      {/* ── Header strip (logo + eyebrow + headline) ─────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
            display: "flex",
          }}
        >
          <SegmentLogo
            width={340}
            segment={segmentKey as SegmentKey}
            aiAppDeveloperDataUrl={aiLockup || undefined}
          />
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 28,
            color: segAccent,
            letterSpacing: isRtl ? 0 : 8,
            textTransform: "uppercase",
            fontWeight: 600,
            lineHeight: 1.4,
            opacity: eyebrowOpacity,
            transform: `translateY(${eyebrowY}px)`,
            display: "flex",
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          {isRtl
            ? `صُنع بالذكاء الاصطناعي · ${segmentLabel}`
            : `Built with AI · ${segmentLabel}`}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1,
            display: "flex",
            flexWrap: "wrap",
            gap: "0 18px",
            opacity: headlineGate,
            direction: isRtl ? "rtl" : "ltr",
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
      </div>

      {/* ── Device (phone or laptop, transformed per scene) ─────────────── */}
      <div
        style={{
          position: "absolute",
          top: isLaptop
            ? CANVAS_H / 2 - apertureH / 2 + 40
            : CANVAS_H / 2 - PHONE_H / 2 + 80,
          left: isLaptop
            ? CANVAS_W / 2 - (apertureW + 28) / 2
            : CANVAS_W / 2 - PHONE_W / 2,
          width: isLaptop ? apertureW + 28 : PHONE_W,
          height: isLaptop ? apertureH + 28 : PHONE_H,
          display: "flex",
          opacity: phoneEnterOpacity,
          transform: phoneTransform,
          transformOrigin: "center center",
        }}
      >
        <Device
          mockup={mockup}
          shotDataUrl={currentFrameSrc}
          imgHeight={imgDisplayHeight}
          scrollY={screenshotY}
          walkMode={useWalk}
          apertureW={apertureW}
          apertureH={apertureH}
          taps={taps}
        />
      </div>

      {/* ── Floating icons orbit the phone during reveal + sideways ────── */}
      {/* These pop in waves: 3 during reveal, 3 during sideways, 3 during upright */}
      <FloatingIcon glyph="✦" x={780} y={620} size={70} start={SCENES.reveal[0] + 25} duration={80} color={segAccent} drift={{ dx: 30, dy: -50 }} />
      <FloatingIcon glyph="⚡" x={240} y={780} size={64} start={SCENES.reveal[0] + 50} duration={75} color="#FFFFFF" drift={{ dx: -40, dy: -30 }} />
      <FloatingIcon glyph="★" x={860} y={1080} size={52} start={SCENES.reveal[0] + 70} duration={70} color={segAccent} drift={{ dx: 50, dy: 20 }} />

      <FloatingIcon glyph="◆" x={780} y={500} size={56} start={SCENES.sideways[0] + 10} duration={120} color={segAccent} drift={{ dx: 30, dy: -40 }} />
      <FloatingIcon glyph="✦" x={180} y={900} size={60} start={SCENES.sideways[0] + 30} duration={110} color="#FFFFFF" drift={{ dx: -30, dy: 30 }} />
      <FloatingIcon glyph="⚡" x={840} y={1200} size={68} start={SCENES.sideways[0] + 50} duration={110} color={segAccent} drift={{ dx: 40, dy: 40 }} />

      <FloatingIcon glyph="✦" x={840} y={680} size={56} start={SCENES.upright[0] + 20} duration={90} color="#FFFFFF" drift={{ dx: 40, dy: -40 }} />
      <FloatingIcon glyph="★" x={200} y={1100} size={48} start={SCENES.upright[0] + 50} duration={90} color={segAccent} drift={{ dx: -30, dy: 20 }} />

      {/* ── Feature pill badges (scenes 3 + 4) ───────────────────────────
          Each pill quotes an actual product feature emitted by Claude, so the
          Reel sells THE APP — not the bootcamp. We render up to 5 pills
          across the two scenes; the data drives content + glyphs. */}
      {(() => {
        const slots: {
          x: number;
          y: number;
          start: number;
          duration: number;
          glyph: string;
        }[] = [
          { x: 140, y: 420,  start: SCENES.sideways[0] + 25, duration: 120, glyph: "✦" },
          { x: 680, y: 580,  start: SCENES.sideways[0] + 55, duration: 100, glyph: "⚡" },
          { x: 120, y: 1280, start: SCENES.sideways[0] + 85, duration: 90,  glyph: "★" },
          { x: 100, y: 780,  start: SCENES.upright[0]  + 30, duration: 130, glyph: "◆" },
          { x: 620, y: 1280, start: SCENES.upright[0]  + 70, duration: 110, glyph: "→" },
        ];
        return features.slice(0, slots.length).map((feature, i) => {
          const slot = slots[i];
          // Render the feature as a single-line label for visual rhythm.
          return (
            <StatBadge
              key={i}
              glyph={slot.glyph}
              value={feature}
              label=""
              x={slot.x}
              y={slot.y}
              start={slot.start}
              duration={slot.duration}
              accent={segAccent}
            />
          );
        });
      })()}

      {/* ── Scene 5 — big infographic on the left side ──────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 80,
          width: 520,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          opacity: infoGate,
          transform: `translateY(${infoSlide}px)`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: segAccent,
            letterSpacing: 8,
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
          }}
        >
          {`What it does`}
        </div>
        {features.slice(0, 4).map((f, i) => {
          const glyphs = ["✦", "⚡", "★", "◆"];
          return (
            <InfoStat
              key={i}
              glyph={glyphs[i % glyphs.length]}
              label={f}
              accent={segAccent}
              delay={i * 10}
              infoFrame={frame - SCENES.infographic[0]}
              fps={fps}
            />
          );
        })}
      </div>

      {/* ── Scene 6 — CTA pill + URL ──────────────────────────────────────
          Pushed further down (top 1640) since the device pulls UP during the
          CTA scene, leaving the lower band clear. Padding bumped vertically
          so descenders ("y", "g", lowered Arabic glyphs) aren't clipped on
          either theme. Pill colors flip per theme so light-mode reads as
          accent-on-white instead of white-on-white. */}
      <div
        style={{
          position: "absolute",
          top: 1640,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: ctaOpacity,
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: segAccent,
            letterSpacing: isRtl ? 0 : 8,
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 22,
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          {isRtl
            ? `جرّب الآن · ${segmentLabel}`
            : `Try it now · ${segmentLabel}`}
        </div>
        <div
          style={{
            padding: "26px 52px",
            backgroundColor: textColor === "#FFFFFF" ? "#FFFFFF" : segAccent,
            color: textColor === "#FFFFFF" ? "#14243F" : "#FFFFFF",
            borderRadius: 100,
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: isRtl ? 0 : -0.5,
            lineHeight: 1.25,
            boxShadow: `0 20px 50px rgba(0,0,0,0.35), 0 0 40px ${segAccent}50`,
            display: "flex",
            alignItems: "center",
          }}
        >
          {isRtl ? `${projectName} ←` : `Try ${projectName} →`}
        </div>
      </div>

      {/* ── Footer (always-on) ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: textDimColor,
          letterSpacing: 6,
          textTransform: "uppercase",
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
  );
};

// Infographic row used in scene 5. Spring-in per row for staggered reveal.
const InfoStat: React.FC<{
  glyph: string;
  label: string;
  accent: string;
  delay: number;
  infoFrame: number;
  fps: number;
}> = ({ glyph, label, accent, delay, infoFrame, fps }) => {
  const p = spring({
    frame: infoFrame - delay,
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        opacity: interpolate(p, [0, 1], [0, 1]),
        transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 76,
          height: 76,
          borderRadius: 20,
          backgroundColor: accent,
          color: "#14243F",
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {glyph}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: "#FFFFFF" }}>
          {label}
        </div>
      </div>
    </div>
  );
};
