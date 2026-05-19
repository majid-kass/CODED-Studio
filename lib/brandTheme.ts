// CODED Brand Theme — full per-product palettes extracted from the official
// Figma library. Source of truth: SKILL.md / coded-theme.json from the design
// team. When the Figma library changes, update both sides of the system.

export type SegmentKey =
  | "ai-app-developer"
  | "codedjuniors"
  | "data-science-bootcamp"
  | "cybersecurity-bootcamp"
  | "academy-x"
  | "unicode"
  | "kuwait-codes"
  | "coded";

export type SegmentPalette = {
  key: SegmentKey;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  /** Optional brighter accent for glow/decoration. */
  accentBright?: string;
  /** Background color when no gradient is used. */
  bg: string;
  /** Gradient endpoint for the radial / linear background. */
  bgEnd: string;
  /** Optional dark anchor (defaults to global CODED navy). */
  dark: string;
};

const NAVY = "#14243F";

export const segments: Record<SegmentKey, SegmentPalette> = {
  "ai-app-developer": {
    key: "ai-app-developer",
    label: "AI App Developer",
    primary: "#00B9B4",      // Light Sea Green
    secondary: "#026678",    // Stormy Teal
    accent: "#16D7D1",       // Strong Cyan
    accentBright: "#62FFE5", // Aquamarine
    bg: "#026678",
    bgEnd: "#0a1326",
    dark: NAVY,
  },
  codedjuniors: {
    key: "codedjuniors",
    label: "CODED Juniors",
    primary: "#FF3E3E",      // Juniors Red
    secondary: "#0147BA",    // Winter Camp Blue
    accent: "#FFCC49",       // Juniors Yellow
    accentBright: "#FF77B9", // Juniors Pink
    bg: "#14243F",           // Juniors typography uses navy; bg for dark-mode social
    bgEnd: "#0a1326",
    dark: NAVY,
  },
  "data-science-bootcamp": {
    key: "data-science-bootcamp",
    label: "Data Science Bootcamp",
    primary: "#C466EF",      // Data Purple
    secondary: NAVY,
    accent: "#C466EF",
    accentBright: "#D896F7",
    bg: NAVY,
    bgEnd: "#0a0d1c",
    dark: NAVY,
  },
  "cybersecurity-bootcamp": {
    key: "cybersecurity-bootcamp",
    label: "Cybersecurity Bootcamp",
    primary: "#2D4BFD",      // Blue Team
    secondary: "#F72961",    // Red Team
    accent: "#2D4BFD",
    accentBright: "#5B73FF",
    bg: NAVY,
    bgEnd: "#00112F",        // Midnight (canonical cyber gradient end)
    dark: "#00112F",
  },
  "academy-x": {
    key: "academy-x",
    label: "Academy-X",
    primary: "#7B28A2",      // Academy Purple
    secondary: "#14C3BB",    // Mint Teal
    accent: "#FF7269",       // Coral
    accentBright: "#14C3BB",
    bg: NAVY,
    bgEnd: "#0a1326",
    dark: NAVY,
  },
  unicode: {
    key: "unicode",
    label: "Unicode",
    primary: "#F46036",      // Unicode Orange
    secondary: "#0094CE",    // Unicode Blue
    accent: "#F46036",
    accentBright: "#FF8252",
    bg: NAVY,
    bgEnd: "#0a1326",
    dark: NAVY,
  },
  "kuwait-codes": {
    key: "kuwait-codes",
    label: "Kuwait Codes",
    primary: "#00A0DF",      // Kuwait Sky
    secondary: "#7E31E0",    // Royal Purple
    accent: "#2ED5F4",       // Bright Cyan
    accentBright: "#FAAC37", // Honey Orange
    bg: "#080827",           // Deep Space
    bgEnd: "#00112F",
    dark: "#080827",
  },
  coded: {
    key: "coded",
    label: "CODED (master)",
    primary: "#004AA3",      // Brand Blue
    secondary: NAVY,
    accent: "#62FFE5",
    accentBright: "#62FFE5",
    bg: NAVY,
    bgEnd: "#0a1326",
    dark: NAVY,
  },
};

export const SEGMENT_OPTIONS: { value: SegmentKey; label: string }[] = [
  { value: "ai-app-developer", label: "AI App Developer" },
  { value: "codedjuniors", label: "CODED Juniors" },
  { value: "data-science-bootcamp", label: "Data Science Bootcamp" },
  { value: "cybersecurity-bootcamp", label: "Cybersecurity Bootcamp" },
  { value: "academy-x", label: "Academy-X" },
  { value: "unicode", label: "Unicode" },
  { value: "kuwait-codes", label: "Kuwait Codes" },
  { value: "coded", label: "CODED (other / general)" },
];

export const DEFAULT_SEGMENT: SegmentKey = "ai-app-developer";

export function getSegment(key?: string | null): SegmentPalette {
  if (key && key in segments) return segments[key as SegmentKey];
  return segments[DEFAULT_SEGMENT];
}

// Background "treatment" — base, accent glow center, gradient + overlay strings
// renderers can drop in directly, and a theme dial that drives text + frame
// colors so each program's canonical mode (Juniors = white slides, Cyber =
// navy→midnight gradient, etc.) actually renders the way the brand book
// prescribes.
export type BgTreatment = {
  base: string;       // solid fallback / outermost background
  accent: string;     // glow center / hero accent
  cssGradient: string;
  cssOverlay?: string; // optional secondary overlay gradient
  /** "light" → navy type on white; "dark" → white type on navy/deep bg. */
  theme: "light" | "dark";
  text: string;       // canonical body text color for this theme
  textDim: string;    // dimmed body text (for footers, labels)
  /** Corner-bracket / hairline divider color appropriate to the theme. */
  rule: string;
};

export function brandBg(seg: SegmentPalette): BgTreatment {
  // Juniors per the brand book: bright social posts use WHITE backgrounds with
  // navy typography and red/yellow accents — NOT the dark gradient that all
  // the bootcamp programs share.
  if (seg.key === "codedjuniors") {
    return {
      base: "#FFFFFF",
      accent: seg.primary, // Juniors Red
      cssGradient: `radial-gradient(circle at 50% 55%, ${hexA(seg.primary, 0.10)} 0%, #FFFFFF 60%)`,
      cssOverlay: `radial-gradient(circle at 80% 80%, ${hexA(seg.accent, 0.12)} 0%, transparent 50%)`,
      theme: "light",
      text: "#14243F",
      textDim: "rgba(20,36,63,0.55)",
      rule: "#14243F",
    };
  }

  // Cybersecurity: canonical vertical gradient navy → midnight, never radial.
  if (seg.key === "cybersecurity-bootcamp") {
    return {
      base: seg.bg,
      accent: seg.primary,
      cssGradient: `linear-gradient(to bottom, ${seg.bg}, ${seg.bgEnd})`,
      cssOverlay: `radial-gradient(circle at 50% 55%, ${hexA(seg.primary, 0.22)} 0%, transparent 55%)`,
      theme: "dark",
      text: "#FFFFFF",
      textDim: "rgba(255,255,255,0.72)",
      rule: "#FFFFFF",
    };
  }

  // Default for the other programs: radial spotlight on the primary against a
  // segment-bg + dark-anchor base. Dark theme — white type.
  return {
    base: seg.bg,
    accent: seg.primary,
    cssGradient: `radial-gradient(circle at 50% 60%, ${hexA(seg.primary, 0.40)} 0%, ${seg.bg} 50%, ${seg.bgEnd} 100%)`,
    cssOverlay: seg.accentBright
      ? `radial-gradient(circle at 50% 65%, ${hexA(seg.accentBright, 0.18)} 0%, transparent 50%)`
      : undefined,
    theme: "dark",
    text: "#FFFFFF",
    textDim: "rgba(255,255,255,0.75)",
    rule: "#FFFFFF",
  };
}

// Convert a #RRGGBB hex to an rgba() string with a given alpha.
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
