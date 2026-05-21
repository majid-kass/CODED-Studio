// Segment-specific program lockup for output renders (PNG / Carousel / Reel).
//
// AI App Developer ships with the official lockup PNG (diamond mark + two-line
// "AI App Developer / Bootcamp"). Other segments don't have a lockup file in
// the repo yet, so we render a typographic fallback inline that adopts the
// segment's accent color: a small diamond glyph + the segment label set in
// two lines if it fits naturally, otherwise one line.
//
// All branches are plain HTML so Satori (next/og) and Remotion both render
// them identically. The PNG branch takes a pre-baked data URL so the caller
// (the render route) handles the fs read once.

import type { SegmentKey } from "@/lib/brandTheme";

const ASPECT = 4.6; // matches the AI App Developer lockup PNG

type Props = {
  width: number;
  segment: SegmentKey;
  /** Pre-baked data URL for the lockup PNG (AI App Developer only). */
  aiAppDeveloperDataUrl?: string;
  /** Accent / text color for typographic fallback. */
  color?: string;
};

export function SegmentLogo({
  width,
  segment,
  aiAppDeveloperDataUrl,
  color = "#FFFFFF",
}: Props) {
  const height = width / ASPECT;

  if (segment === "ai-app-developer" && aiAppDeveloperDataUrl) {
    return (
      <div style={{ display: "flex", width, height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={aiAppDeveloperDataUrl}
          width={width}
          height={height}
          alt=""
          style={{ display: "block", width, height, objectFit: "contain" }}
        />
      </div>
    );
  }

  // Typographic fallback for every other segment.
  // Diamond mark + two-line "{Segment} / Bootcamp" or "{Segment} / Program"
  // depending on whether the label fits "Bootcamp" semantically.
  const label = labelFor(segment);
  const markSize = Math.round(height * 0.95);
  const titleSize = Math.round(height * 0.38);
  const subSize = Math.round(height * 0.30);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(height * 0.2),
        width,
        height,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: markSize,
          height: markSize,
          color,
          fontSize: markSize * 0.9,
          lineHeight: 1,
          fontWeight: 900,
        }}
      >
        ◆
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            color,
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {label.line1}
        </div>
        <div
          style={{
            color,
            opacity: 0.85,
            fontSize: subSize,
            fontWeight: 600,
            lineHeight: 1,
            display: "flex",
          }}
        >
          {label.line2}
        </div>
      </div>
    </div>
  );
}

function labelFor(segment: SegmentKey): { line1: string; line2: string } {
  switch (segment) {
    case "ai-app-developer":
      return { line1: "AI App Developer", line2: "Bootcamp" };
    case "codedjuniors":
      return { line1: "CODED", line2: "Juniors" };
    case "data-science-bootcamp":
      return { line1: "Data Science", line2: "Bootcamp" };
    case "cybersecurity-bootcamp":
      return { line1: "Cybersecurity", line2: "Bootcamp" };
    case "academy-x":
      return { line1: "Academy", line2: "X" };
    case "unicode":
      return { line1: "Unicode", line2: "Program" };
    case "kuwait-codes":
      return { line1: "Kuwait", line2: "Codes" };
    case "coded":
    default:
      return { line1: "CODED", line2: "Studio" };
  }
}
