// v1 stub copy generator. Will be replaced with Claude in v2.
// Returns the kind of fields the real generator will produce.

export type GeneratedCopy = {
  headline: string;
  bullets: string[];
  caption: string;
  hashtags: string[];
};

function firstSentence(s: string) {
  const trimmed = s.trim().replace(/\s+/g, " ");
  const stop = trimmed.search(/[.!?]/);
  return (stop === -1 ? trimmed : trimmed.slice(0, stop)).trim();
}

function shortHeadline(pitch: string, fallback: string) {
  const sentence = firstSentence(pitch);
  if (!sentence) return fallback;
  // Trim to first natural break (comma / dash / semicolon) if it's earlier than ~60 chars.
  const breakAt = sentence.search(/[,—–;]/);
  const candidate =
    breakAt > 0 && breakAt < 70 ? sentence.slice(0, breakAt) : sentence;
  const capped = candidate.length > 70 ? candidate.slice(0, 67) + "…" : candidate;
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

export function generateCopy(input: { name: string; pitch: string }): GeneratedCopy {
  const cleaned = firstSentence(input.pitch);
  const headline = shortHeadline(input.pitch, input.name);

  const bullets = [
    "Built with AI",
    "Shipped fast",
    "Real product, real users",
  ];

  const caption = [
    `Meet ${input.name}.`,
    `${cleaned}.`,
    ``,
    `Another product built by a CODED AI App Developer Bootcamp grad — proving you can take an idea from zero to live in weeks, not quarters.`,
    ``,
    `Want to build like this? Link in bio.`,
  ].join("\n");

  const hashtags = [
    "#CODED",
    "#AIAppDeveloper",
    "#BuiltWithAI",
    "#KuwaitTech",
    "#StartupKW",
    "#AIBootcamp",
    "#ProductLaunch",
  ];

  return { headline, bullets, caption, hashtags };
}
