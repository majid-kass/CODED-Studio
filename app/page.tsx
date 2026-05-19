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
      <BrandBackdrop />
      <FloatingDecorations />

      <header className="relative z-20 px-6 sm:px-10 py-6 flex items-center justify-between">
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

      <section className="relative z-20 flex-1 flex flex-col items-center px-6 pb-16">
        <div className="w-full max-w-5xl mt-10 sm:mt-16 mb-12 sm:mb-16 text-center">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-white/50 mb-5">
            CODED · Capstone Showcase
          </p>
          <h1 className="font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-[clamp(64px,13vw,180px)]">
            Project
            <br />
            <span className="text-white/85">Showcase</span>
          </h1>
        </div>

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

      <footer className="relative z-20 px-6 sm:px-10 py-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/40">
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

// Layered ambient gradients — give the navy field a sense of depth without
// distracting from the form. Two radials: brand-blue glow up top, soft
// aquamarine in the lower-right corner.
function BrandBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(0,74,163,0.35) 0%, rgba(20,36,63,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(40% 40% at 100% 100%, rgba(98,255,229,0.10) 0%, rgba(20,36,63,0) 60%)",
        }}
      />
    </>
  );
}

// Floating decorative marks scattered around the canvas. Visual language is
// the CODED [bracket] motif plus code-styled glyphs, with subtle drift
// animations so the page feels alive without distracting from the form.
function FloatingDecorations() {
  const marks: {
    glyph: string;
    top: string;
    left?: string;
    right?: string;
    size: number;
    rotate: number;
    color: string;
    opacity: number;
    delay: number;
    duration: number;
  }[] = [
    { glyph: "[ ]",  top: "14%", left: "6%",   size: 56,  rotate: -8,  color: "#FFFFFF", opacity: 0.10, delay: 0,   duration: 9 },
    { glyph: "✦",    top: "22%", right: "8%",  size: 38,  rotate: 12,  color: "#62FFE5", opacity: 0.55, delay: 1,   duration: 7 },
    { glyph: "</>",  top: "34%", left: "10%",  size: 30,  rotate: 0,   color: "#FFFFFF", opacity: 0.25, delay: 2.5, duration: 8 },
    { glyph: "[ ]",  top: "60%", right: "4%",  size: 96,  rotate: 10,  color: "#FFFFFF", opacity: 0.06, delay: 1.5, duration: 12 },
    { glyph: "{ }",  top: "70%", left: "3%",   size: 44,  rotate: -6,  color: "#FFFFFF", opacity: 0.18, delay: 0.5, duration: 10 },
    { glyph: "✦",    top: "82%", right: "12%", size: 26,  rotate: 0,   color: "#62FFE5", opacity: 0.6,  delay: 3,   duration: 6 },
    { glyph: "★",    top: "8%",  right: "30%", size: 22,  rotate: 0,   color: "#FFFFFF", opacity: 0.35, delay: 4,   duration: 5 },
    { glyph: "•",    top: "50%", right: "16%", size: 18,  rotate: 0,   color: "#62FFE5", opacity: 0.8,  delay: 2,   duration: 4 },
    { glyph: "•",    top: "44%", left: "18%",  size: 14,  rotate: 0,   color: "#FFFFFF", opacity: 0.5,  delay: 0,   duration: 4 },
    { glyph: "→",    top: "92%", left: "44%",  size: 30,  rotate: 0,   color: "#FFFFFF", opacity: 0.25, delay: 2,   duration: 9 },
  ];
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0px) rotate(var(--rot,0deg)); }
          50%      { transform: translateY(-14px) rotate(calc(var(--rot,0deg) + 2deg)); }
        }
      `}</style>
      {marks.map((m, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: m.top,
            left: m.left,
            right: m.right,
            fontSize: m.size,
            color: m.color,
            opacity: m.opacity,
            fontWeight: 800,
            fontFamily: "DM Sans, Helvetica, Arial, sans-serif",
            letterSpacing: "0.05em",
            textShadow: m.color === "#62FFE5"
              ? `0 0 ${m.size * 0.5}px rgba(98,255,229,0.45)`
              : undefined,
            // CSS var for the drift keyframes
            ["--rot" as string]: `${m.rotate}deg`,
            transform: `rotate(${m.rotate}deg)`,
            animation: `drift ${m.duration}s ease-in-out ${m.delay}s infinite`,
            willChange: "transform",
          } as React.CSSProperties}
        >
          {m.glyph}
        </span>
      ))}
    </div>
  );
}
