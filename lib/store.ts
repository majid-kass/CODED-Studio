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
