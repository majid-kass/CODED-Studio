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

// Tap ripple animation — expanding ring with fading opacity.
const TapRipple: React.FC<{ x: number; y: number; startFrame: number }> = ({
  x,
  y,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > 28) return null;
  const progress = local / 28;
  const size = interpolate(progress, [0, 1], [16, 220]);
  const opacity = interpolate(progress, [0, 0.15, 1], [0, 0.95, 0]);
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
        boxShadow: "0 0 30px rgba(255,255,255,0.55)",
        opacity,
      }}
    />
  );
};

// Small finger-tip dot drawn on top of the ripple for tactile clarity.
const TapDot: React.FC<{ x: number; y: number; startFrame: number }> = ({
  x,
  y,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
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
        boxShadow: "0 0 20px rgba(255,255,255,0.6)",
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};

// Page navigation cycle: hold on a section, tap, snap to next section.
// Phone screen behaves like a tap-driven scrolling app, not a smooth scroll.
type PageStop = {
  scrollY: number;       // negative offset applied to the screenshot
  holdFrames: number;    // settle + hold on this page
  jumpFrames: number;    // spring transition to the next page (0 for last)
  tapX: number;          // ripple x within aperture
  tapY: number;          // ripple y within aperture
  startFrame: number;    // global frame where this stop begins
};

function buildPageStops(
  scrollDistance: number,
  navStart: number,
  navEnd: number
): PageStop[] {
  const navFrames = navEnd - navStart;
  // Number of "pages" to visit. If the screenshot fits in one aperture, still
  // do 2 stops so a tap-and-jump happens; otherwise space them by aperture
  // height with a soft cap so each page gets enough screen time.
  const ideal = Math.ceil(scrollDistance / (APERTURE_H * 0.85)) + 1;
  const stopCount = Math.max(2, Math.min(5, ideal));

  // Scroll positions are evenly spaced along the available scroll distance.
  // Last position lands exactly at scrollDistance so the page bottom is shown.
  const positions: number[] = [];
  for (let i = 0; i < stopCount; i++) {
    const t = stopCount === 1 ? 0 : i / (stopCount - 1);
    positions.push(-scrollDistance * t);
  }

  const perStopFrames = Math.floor(navFrames / stopCount);
  const jumpFrames = Math.min(18, Math.floor(perStopFrames * 0.25));

  // Tap targets cycle through plausible positions: primary CTA, mid-card, nav,
  // back to CTA. Anchored in aperture-relative coords.
  const tapPattern: [number, number][] = [
    [0.5, 0.74],
    [0.5, 0.42],
    [0.78, 0.18],
    [0.5, 0.66],
    [0.32, 0.5],
  ];

  const stops: PageStop[] = [];
  for (let i = 0; i < stopCount; i++) {
    const isLast = i === stopCount - 1;
    const [tx, ty] = tapPattern[i % tapPattern.length];
    stops.push({
      scrollY: positions[i],
      holdFrames: perStopFrames - (isLast ? 0 : jumpFrames),
      jumpFrames: isLast ? 0 : jumpFrames,
      tapX: APERTURE_W * tx,
      tapY: APERTURE_H * ty,
      startFrame: navStart + i * perStopFrames,
    });
  }
  return stops;
}

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

  const glowPulse = 0.85 + 0.15 * Math.sin((frame / fps) * Math.PI * 0.4);

  const logoOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(frame, [10, 40], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const eyebrowProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const eyebrowY = interpolate(eyebrowProgress, [0, 1], [30, 0]);
  const eyebrowOpacity = interpolate(eyebrowProgress, [0, 1], [0, 1]);

  const words = headline.split(" ");
  const headlineStart = 40;
  const wordGap = 4;

  const phoneProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });
  const phoneY = interpolate(phoneProgress, [0, 1], [700, 0]);
  const phoneOpacity = interpolate(phoneProgress, [0, 1], [0, 1]);

  // Tap-driven page navigation. Phone enters at f60–f120; nav runs f120–f720;
  // CTA chip overlays f825–f900.
  const imgScale = APERTURE_W / shotWidth;
  const imgDisplayHeight = shotHeight * imgScale;
  const scrollDistance = Math.max(0, imgDisplayHeight - APERTURE_H);

  const navStart = 120;
  const navEnd = 720;
  const stops = buildPageStops(scrollDistance, navStart, navEnd);

  // Current scroll position: hold at stop[i].scrollY during hold window, then
  // spring-transition to stop[i+1].scrollY during the jump window.
  let screenshotY = stops[0].scrollY;
  if (frame >= navStart) {
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const holdEnd = stop.startFrame + stop.holdFrames;
      const jumpEnd = holdEnd + stop.jumpFrames;
      const next = stops[i + 1];
      if (frame < holdEnd) {
        screenshotY = stop.scrollY;
        break;
      }
      if (frame < jumpEnd && next) {
        // Spring-eased snap to next page — feels like the app jumping on tap.
        const jp = spring({
          frame: frame - holdEnd,
          fps,
          durationInFrames: stop.jumpFrames,
          config: { damping: 16, stiffness: 200, mass: 0.7 },
        });
        screenshotY = interpolate(jp, [0, 1], [stop.scrollY, next.scrollY]);
        break;
      }
      if (i === stops.length - 1) screenshotY = stop.scrollY;
    }
  }
  // After nav ends, stay on the final stop.
  if (frame >= navEnd) {
    screenshotY = stops[stops.length - 1].scrollY;
  }

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
      <AbsoluteFill
        style={{
          backgroundImage: bgGradient,
          opacity: glowPulse,
        }}
      />
      {bgOverlay && (
        <AbsoluteFill
          style={{
            backgroundImage: bgOverlay,
            opacity: glowPulse,
          }}
        />
      )}

      <AbsoluteFill style={{ padding: "70px 60px", display: "flex" }}>
        <div
          style={{
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
          }}
        >
          <Img src={logoDataUrl} style={{ width: 320, height: "auto" }} />
        </div>

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

              {/* Tap feedback — one ripple + finger dot per page stop, fired
                  ~24 frames before the jump so the cause-and-effect reads. */}
              {stops.map((stop, i) => {
                if (i === stops.length - 1) return null;
                const tapFrame = stop.startFrame + stop.holdFrames - 24;
                return (
                  <span key={i}>
                    <TapRipple x={stop.tapX} y={stop.tapY} startFrame={tapFrame} />
                    <TapDot x={stop.tapX} y={stop.tapY} startFrame={tapFrame} />
                  </span>
                );
              })}

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
