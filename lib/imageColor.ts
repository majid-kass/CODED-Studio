import sharp from "sharp";

export type RGB = { r: number; g: number; b: number };

// Pull a "vibe" color from the hero portion of the screenshot. Mean across the
// hero region gives a better feel-color than the dominant single-pixel-cluster,
// which often locks onto a dark text overlay or navbar.
export async function dominantHeroColor(buf: Buffer): Promise<RGB> {
  const img = sharp(buf);
  const meta = await img.metadata();
  const w = meta.width ?? 800;
  const h = meta.height ?? 1600;
  // Skip the top 8% (status bar / sticky nav) and sample the hero band.
  const top = Math.floor(h * 0.08);
  const heroH = Math.max(100, Math.min(Math.floor(h * 0.25), h - top));
  const stats = await sharp(buf)
    .extract({ left: 0, top, width: w, height: heroH })
    .stats();
  // Mean of RGB channels — softer, more representative than dominant.
  const r = Math.round(stats.channels[0].mean);
  const g = Math.round(stats.channels[1].mean);
  const b = Math.round(stats.channels[2].mean);
  return { r, g, b };
}

// Mix the dominant color toward navy so the background reads as "branded by the
// project" but stays in CODED's visual world (dark, readable, brand-coherent).
export function brandedBackground(c: RGB): {
  base: string;
  accent: string;
  cssGradient: string;
} {
  const mix = (a: number, b: number, t: number) => Math.round(a * (1 - t) + b * t);
  // Pull dominant toward navy (#14243F) for the base. Saturate it slightly for the accent.
  const base = {
    r: mix(c.r, 0x14, 0.78),
    g: mix(c.g, 0x24, 0.78),
    b: mix(c.b, 0x3f, 0.78),
  };
  const accent = {
    r: mix(c.r, 255, 0.18),
    g: mix(c.g, 255, 0.18),
    b: mix(c.b, 255, 0.18),
  };
  const rgb = (x: RGB) => `rgb(${x.r}, ${x.g}, ${x.b})`;
  const baseStr = rgb(base);
  const accentStr = rgb(accent);
  return {
    base: baseStr,
    accent: accentStr,
    cssGradient: `radial-gradient(circle at 50% 62%, ${accentStr} 0%, ${baseStr} 55%, #0a1326 100%)`,
  };
}
