// Parse the per-render UI options the admin picks in the queue card before
// hitting Generate. Both options are optional — falling back to the segment's
// canonical theme and a phone mockup matches the current behavior.

import type { BgTreatment } from "./brandTheme";

export type ThemeOverride = "auto" | "light" | "dark";
export type MockupChoice = "phone" | "laptop";

export function parseRenderOptions(req: Request): {
  themeOverride: ThemeOverride;
  mockup: MockupChoice;
} {
  const u = new URL(req.url);
  const t = u.searchParams.get("theme");
  const m = u.searchParams.get("mockup");
  return {
    themeOverride:
      t === "light" || t === "dark" ? t : "auto",
    mockup: m === "laptop" ? "laptop" : "phone",
  };
}

// If the admin chose a non-auto theme, swap the bg treatment's theme + text
// tokens accordingly. The base/gradient stay segment-tied so the program color
// identity survives the theme flip.
export function applyThemeOverride(
  bg: BgTreatment,
  override: ThemeOverride,
): BgTreatment {
  if (override === "auto") return bg;
  if (override === "light") {
    return {
      ...bg,
      base: "#FFFFFF",
      cssGradient: `radial-gradient(circle at 50% 60%, rgba(0,0,0,0.04) 0%, #FFFFFF 60%)`,
      cssOverlay: undefined,
      theme: "light",
      text: "#14243F",
      textDim: "rgba(20,36,63,0.55)",
      rule: "#14243F",
    };
  }
  // dark — keep the segment's dark gradient but force dark tokens.
  return {
    ...bg,
    theme: "dark",
    text: "#FFFFFF",
    textDim: "rgba(255,255,255,0.75)",
    rule: "#FFFFFF",
  };
}
