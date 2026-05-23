// Parse the per-render UI options the admin picks in the queue card before
// hitting Generate. Both options are optional — falling back to the segment's
// canonical theme and a phone mockup matches the current behavior.

import type { BgTreatment } from "./brandTheme";
import type { Submission } from "./store";
import { patchSubmission } from "./store";
import { translateMarketingCopy } from "./marketingCopy";

export type ThemeOverride = "auto" | "light" | "dark";
export type MockupChoice = "phone" | "laptop";
export type LangChoice = "auto" | "en" | "ar";

export function parseRenderOptions(req: Request): {
  themeOverride: ThemeOverride;
  mockup: MockupChoice;
  lang: LangChoice;
} {
  const u = new URL(req.url);
  const t = u.searchParams.get("theme");
  const m = u.searchParams.get("mockup");
  const l = u.searchParams.get("lang");
  return {
    themeOverride:
      t === "light" || t === "dark" ? t : "auto",
    mockup: m === "laptop" ? "laptop" : "phone",
    lang: l === "en" || l === "ar" ? l : "auto",
  };
}

/**
 * Resolve which copy (headline / caption / features) a render should use
 * given the admin's language choice. If they picked the submission's native
 * language, return as-is. Otherwise look up the cached translation, or
 * generate + cache one via Claude.
 */
export async function resolveCopyForLang(
  submission: Submission,
  lang: LangChoice,
): Promise<{ headline: string; caption: string; features: string[]; lang: "en" | "ar" }> {
  const native = submission.language ?? "en";
  const target: "en" | "ar" = lang === "auto" ? native : lang;
  if (target === native) {
    return {
      headline: submission.headline,
      caption: submission.caption,
      features: submission.features ?? [],
      lang: target,
    };
  }
  if (submission.arabic && target === "ar") {
    return { ...submission.arabic, lang: "ar" };
  }
  // Need to (lazily) translate. We currently only cache the AR side because
  // EN is the default for the bulk of submissions.
  const translated = await translateMarketingCopy(
    {
      headline: submission.headline,
      caption: submission.caption,
      features: submission.features ?? [],
    },
    target,
  );
  if (target === "ar") {
    await patchSubmission(submission.id, { arabic: translated });
  }
  return { ...translated, lang: target };
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
