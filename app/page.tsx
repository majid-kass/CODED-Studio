"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CodedLogo } from "@/components/CodedLogo";
import {
  SEGMENT_OPTIONS,
  type SegmentKey,
} from "@/lib/brandTheme";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [segment, setSegment] = useState<SegmentKey | "">("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, name, pitch, segment, consent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient brand glow — subtle radial that hints at depth without distracting */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(0,74,163,0.35) 0%, rgba(20,36,63,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(40% 40% at 100% 100%, rgba(98,255,229,0.10) 0%, rgba(20,36,63,0) 60%)",
        }}
      />

      <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
        <CodedLogo width={110} />
        {signedIn ? (
          <Link
            href="/queue"
            className="text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white transition whitespace-nowrap"
          >
            Dashboard →
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white transition whitespace-nowrap"
          >
            Admin sign in
          </Link>
        )}
      </header>

      <section className="relative z-10 flex-1 flex flex-col items-center px-6 pb-16">
        {/* Hero wordmark — the brand statement */}
        <div className="w-full max-w-5xl mt-10 sm:mt-16 mb-12 sm:mb-16 text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-white/50 mb-5">
            CODED · Capstone Showcase
          </p>
          <h1 className="font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-[clamp(64px,13vw,180px)]">
            CODED
            <br />
            <span className="text-white/85">Showcase</span>
          </h1>
          <p className="mt-8 sm:mt-10 max-w-2xl mx-auto text-lg sm:text-xl text-white/70 leading-relaxed">
            Drop your project URL. We turn it into a ready-to-post Instagram package —
            single image, 5-slide carousel, and a 30-second reel — no manual design,
            no copywriting.
          </p>
          <FeatureRow />
        </div>

        {/* Submission form */}
        <div className="w-full max-w-xl">
          {status === "done" ? (
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-2">Thanks — got it.</h2>
              <p className="text-white/70 mb-6">
                Your submission is in the queue. We&apos;ll review and post it from the CODED channels.
              </p>
              <button
                onClick={() => {
                  setUrl("");
                  setName("");
                  setPitch("");
                  setSegment("");
                  setConsent(false);
                  setStatus("idle");
                }}
                className="text-sm uppercase tracking-[0.25em] text-white/70 hover:text-white transition"
              >
                Submit another →
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9 backdrop-blur-sm space-y-6"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
                Submit your project
              </p>

              <Field label="Project URL">
                <input
                  type="url"
                  required
                  placeholder="https://your-project.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                />
              </Field>
              <Field label="Project name">
                <input
                  type="text"
                  required
                  placeholder="Loft5 Booking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                />
              </Field>
              <Field label="One line — what is it?">
                <input
                  type="text"
                  required
                  placeholder="An AI-powered event space booking platform"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                />
              </Field>
              <Field label="Which CODED program?">
                <select
                  required
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as SegmentKey)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-coded-navy">
                    Select your program…
                  </option>
                  {SEGMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-coded-navy">
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <label className="flex items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <span>
                  You can use this project for CODED marketing (Instagram, web, etc.) with credit.
                </span>
              </label>

              {errorMsg && (
                <p className="text-sm text-red-300">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-lg bg-white hover:bg-white/90 disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] py-4"
              >
                {status === "submitting" ? "Submitting…" : "Submit project"}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/40">
        <span>coded.kw</span>
        <span>@coded.kw</span>
      </footer>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.25em] text-white/60 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function FeatureRow() {
  const items = [
    { glyph: "✦", label: "AI copy · EN + AR" },
    { glyph: "★", label: "1080×1920 image" },
    { glyph: "◆", label: "5-slide carousel" },
    { glyph: "⚡", label: "30-second reel" },
  ];
  return (
    <ul className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {items.map((it) => (
        <li
          key={it.label}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-white/80"
        >
          <span className="text-white">{it.glyph}</span>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
