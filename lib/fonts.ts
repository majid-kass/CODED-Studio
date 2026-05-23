// Font loader for Satori (next/og ImageResponse). Satori doesn't pick up
// system fonts — every glyph it draws must come from a font file we pass in.
// Default font for Arabic / Latin is loaded lazily and cached for the
// process lifetime so we only hit disk once per Node worker.

import { promises as fs } from "fs";
import path from "path";

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800 | 900;
  style: "normal";
};

const cache: Record<string, ArrayBuffer> = {};

async function loadTtf(rel: string): Promise<ArrayBuffer> {
  if (cache[rel]) return cache[rel];
  const buf = await fs.readFile(path.join(process.cwd(), "public", "fonts", rel));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  cache[rel] = ab;
  return ab;
}

/** Arabic font set passed to ImageResponse when the resolved copy is RTL. */
export async function arabicFonts(): Promise<SatoriFont[]> {
  const [bold, regular] = await Promise.all([
    loadTtf("NotoSansArabic-Bold.ttf"),
    loadTtf("NotoSansArabic-Regular.ttf"),
  ]);
  // Use the same font name for all weights so font-family inheritance just
  // works in the Satori JSX — Satori picks the right weight off the list.
  return [
    { name: "Noto Sans Arabic", data: regular, weight: 400, style: "normal" },
    { name: "Noto Sans Arabic", data: bold, weight: 700, style: "normal" },
    { name: "Noto Sans Arabic", data: bold, weight: 800, style: "normal" },
    { name: "Noto Sans Arabic", data: bold, weight: 900, style: "normal" },
  ];
}
