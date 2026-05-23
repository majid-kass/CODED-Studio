import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "./supabase/server";
import type { SegmentKey } from "./brandTheme";

export type Submission = {
  id: string;
  url: string;
  name: string;
  pitch: string;
  createdAt: string;
  screenshotUrl: string;
  headline: string;
  bullets: string[];
  caption: string;
  hashtags: string[];
  features?: string[];
  language?: "en" | "ar";
  segment?: SegmentKey;
  shotWidth?: number;
  shotHeight?: number;
  /** Submitter contact — captured so we can attribute / follow up. Not
      rendered into the public Instagram outputs. */
  submitterName?: string;
  submitterEmail?: string;
  /** Lazily-generated Arabic translation of headline/caption/features.
      Filled when admin requests an Arabic render of an English submission. */
  arabic?: {
    headline: string;
    caption: string;
    features: string[];
  };
};

// Public anon client. Used by addSubmission (the submit form is open to
// unauthenticated trainees) — the insert RLS policy permits it.
function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, anon, { auth: { persistSession: false } });
}

// Reads use the cookie-bound server client so the user's JWT satisfies the
// "authenticated" RLS policy on submissions. listSubmissions is only ever
// called from gated routes (/queue, /api/render/*) so the session is present.
export async function listSubmissions(): Promise<Submission[]> {
  const client = await supabaseServer();
  const { data, error } = await client
    .from("submissions")
    .select("data")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listSubmissions:", error);
    return [];
  }
  return (data ?? []).map((row) => row.data as Submission);
}

export async function addSubmission(s: Submission) {
  const client = anonClient();
  const { error } = await client
    .from("submissions")
    .insert({ id: s.id, data: s });
  if (error) {
    throw new Error(`addSubmission failed: ${error.message}`);
  }
}

/** Patch a submission's data column — used when we want to cache derived
 * content (e.g. an Arabic translation) without bouncing through the form. */
export async function patchSubmission(id: string, patch: Partial<Submission>) {
  const client = await supabaseServer();
  const { data: existing } = await client
    .from("submissions")
    .select("data")
    .eq("id", id)
    .single();
  if (!existing) return;
  const merged = { ...(existing.data as Submission), ...patch };
  const { error } = await client
    .from("submissions")
    .update({ data: merged })
    .eq("id", id);
  if (error) {
    throw new Error(`patchSubmission failed: ${error.message}`);
  }
}
