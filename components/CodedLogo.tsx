// Bracketed CODED wordmark — rendered as plain HTML so it works in every
// environment we ship to:
//   - App Router pages (React DOM)
//   - Satori / next/og ImageResponse (PNG + Carousel) — does not support
//     SVG <text>, but does support HTML + flex
//   - Remotion (real Chromium)
//
// Aspect ratio is fixed at ~2.8:1 to match the original PNG it replaces.

type Props = {
  width: number;
  color?: string;
  /** Border thickness as a fraction of height. Default 0.07. */
  strokeRatio?: number;
};

const ASPECT = 2.8;

export function CodedLogo({ width, color = "#FFFFFF", strokeRatio = 0.07 }: Props) {
  const height = width / ASPECT;
  const border = Math.max(2, Math.round(height * strokeRatio));
  const fontSize = Math.round(height * 0.6);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width,
        height,
        border: `${border}px solid ${color}`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color,
          fontSize,
          fontWeight: 900,
          letterSpacing: `${Math.round(fontSize * 0.08)}px`,
          lineHeight: 1,
          fontFamily: "DM Sans, Helvetica, Arial, sans-serif",
          display: "flex",
        }}
      >
        CODED
      </div>
    </div>
  );
}
