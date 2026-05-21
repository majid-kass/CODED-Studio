// Supabase Storage wrapper. Replaces the data/screenshots/ filesystem cache
// so the app works the same on any host (Railway today, anywhere tomorrow)
// without depending on a persistent local disk. Files survive deploys and
// container restarts.
//
// Bucket layout — see migration `create_screenshots_bucket`:
//   shots/{id}-mobile.png      Microlink mobile-viewport full-page capture
//   shots/{id}-desktop.png     Microlink desktop-viewport full-page capture
//   walk/{id}-mobile-{i}.png   Playwright walkthrough frame i (mobile)
//   walk/{id}-desktop-{i}.png  Playwright walkthrough frame i (desktop)

import { supabaseServer } from "./supabase/server";
import type { Viewport } from "./screenshot";

const BUCKET = "screenshots";

// All storage callers run from auth-gated routes (middleware blocks anon),
// so the cookie-bound server client picks up the admin's JWT and satisfies
// the "authenticated" RLS policies on the screenshots bucket.
async function client() {
  return supabaseServer();
}

export function shotKey(id: string, viewport: Viewport = "mobile") {
  const vp = viewport === "desktop" ? "desktop" : "mobile";
  return `shots/${id}-${vp}.png`;
}

export function walkFrameKey(
  id: string,
  viewport: Viewport,
  index: number,
) {
  const vp = viewport === "desktop" ? "desktop" : "mobile";
  return `walk/${id}-${vp}-${index}.png`;
}

export async function readObject(key: string): Promise<Buffer | null> {
  const { data, error } = await (await client()).storage.from(BUCKET).download(key);
  if (error || !data) return null;
  const arr = await data.arrayBuffer();
  return Buffer.from(arr);
}

export async function writeObject(key: string, buf: Buffer): Promise<void> {
  const c = await client();
  const { error } = await c.storage
    .from(BUCKET)
    .upload(key, buf, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "86400",
    });
  if (error) {
    throw new Error(`Storage upload failed (${key}): ${error.message}`);
  }
}

/** Probe — used by the queue page to decide whether to show the preview. */
export async function objectExists(key: string): Promise<boolean> {
  const slash = key.lastIndexOf("/");
  const dir = slash === -1 ? "" : key.slice(0, slash);
  const name = slash === -1 ? key : key.slice(slash + 1);
  const c = await client();
  const { data, error } = await c.storage
    .from(BUCKET)
    .list(dir, { search: name, limit: 1 });
  if (error) return false;
  return !!data?.some((f) => f.name === name);
}
