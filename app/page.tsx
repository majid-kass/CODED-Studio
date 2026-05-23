"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CodedLogo } from "@/components/CodedLogo";
import {
  SEGMENT_OPTIONS,
  type SegmentKey,
} from "@/lib/brandTheme";

type Lang = "en" | "ar";

const COPY = {
  en: {
    dir: "ltr",
    h1Line1: "Project",
    h1Line2: "Showcase",
    submit: "Submit your project",
    yourName: "Your name",
    yourEmail: "Your email",
    projectUrl: "Project URL",
    projectName: "Project name",
    oneLine: "Tell us about your project",
    program: "Which CODED program?",
    selectProgram: "Select your program…",
    consent: "You can use this project for CODED marketing (Instagram, web, etc.) with credit.",
    submitting: "Submitting…",
    submitBtn: "Submit project",
    thanks: "Thanks — got it.",
    thanksBody: "Your submission is in the queue. We'll review and post it from the CODED channels.",
    again: "Submit another →",
    dashboard: "Dashboard →",
    adminSignIn: "Admin sign in",
    placeholderUrl: "https://your-project.com",
    placeholderName: "Loft5 Booking",
    placeholderYourName: "Layla Al-Sabah",
    placeholderYourEmail: "you@example.com",
    placeholderPitch: "An AI-powered event space booking platform that lets users discover, book, and pay for rooftop venues across Kuwait.",
    langToggle: "العربية",
  },
  ar: {
    dir: "rtl",
    h1Line1: "معرض",
    h1Line2: "المشاريع",
    submit: "أرسل مشروعك",
    yourName: "اسمك",
    yourEmail: "بريدك الإلكتروني",
    projectUrl: "رابط المشروع",
    projectName: "اسم المشروع",
    oneLine: "أخبرنا عن مشروعك",
    program: "أي برنامج من برامج كوديد؟",
    selectProgram: "اختر برنامجك…",
    consent: "يمكن استخدام هذا المشروع للتسويق على قنوات كوديد (إنستغرام، الويب، إلخ) مع ذكر الاسم.",
    submitting: "جارٍ الإرسال…",
    submitBtn: "إرسال المشروع",
    thanks: "شكرًا — وصلتنا.",
    thanksBody: "تم إضافة المشروع إلى قائمة المراجعة. سنراجعه وننشره من قنوات كوديد.",
    again: "← إرسال مشروع آخر",
    dashboard: "← لوحة التحكم",
    adminSignIn: "دخول المسؤول",
    placeholderUrl: "https://your-project.com",
    placeholderName: "حجوزات لوفت 5",
    placeholderYourName: "ليلى السبت",
    placeholderYourEmail: "you@example.com",
    placeholderPitch: "منصة حجز مساحات فعاليات مدعومة بالذكاء الاصطناعي تتيح للمستخدمين اكتشاف وحجز ودفع تكاليف مساحات الأسطح في الكويت.",
    langToggle: "English",
  },
} as const;

export default function SubmitPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [segment, setSegment] = useState<SegmentKey | "">("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  const t = COPY[lang];
  const isRtl = lang === "ar";

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
        body: JSON.stringify({
          url,
          name,
          pitch,
          segment,
          consent,
          submitterName,
          submitterEmail,
        }),
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
    <main
      dir={t.dir}
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      <BrandBackdrop />
      <FloatingDecorations />

      <header className="relative z-20 px-6 sm:px-10 py-6 flex items-center justify-between">
        <CodedLogo width={110} />
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setLang((l) => (l === "en" ? "ar" : "en"))}
            className="text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white transition whitespace-nowrap"
            aria-label="Switch language"
          >
            {t.langToggle}
          </button>
          {signedIn ? (
            <Link
              href="/queue"
              className="text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white transition whitespace-nowrap"
            >
              {t.dashboard}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-white transition whitespace-nowrap"
            >
              {t.adminSignIn}
            </Link>
          )}
        </div>
      </header>

      <section className="relative z-20 flex-1 flex flex-col items-center px-6 pb-16">
        <div className="w-full max-w-5xl mt-12 sm:mt-20 mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 sm:gap-8">
            <Brace
              char="{"
              className="text-[clamp(120px,18vw,260px)] leading-none"
            />
            <h1 className="text-center font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-[clamp(56px,11vw,150px)]">
              {t.h1Line1}
              <br />
              <span className="text-white/85">{t.h1Line2}</span>
            </h1>
            <Brace
              char="}"
              className="text-[clamp(120px,18vw,260px)] leading-none"
            />
          </div>
        </div>

        <div className="w-full max-w-xl">
          {status === "done" ? (
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-2">{t.thanks}</h2>
              <p className="text-white/70 mb-6">{t.thanksBody}</p>
              <button
                onClick={() => {
                  setUrl("");
                  setName("");
                  setPitch("");
                  setSegment("");
                  setConsent(false);
                  setSubmitterName("");
                  setSubmitterEmail("");
                  setStatus("idle");
                }}
                className="text-sm uppercase tracking-[0.25em] text-white/70 hover:text-white transition"
              >
                {t.again}
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9 backdrop-blur-sm space-y-6"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
                {t.submit}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t.yourName} isRtl={isRtl}>
                  <input
                    type="text"
                    required
                    placeholder={t.placeholderYourName}
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                  />
                </Field>
                <Field label={t.yourEmail} isRtl={isRtl}>
                  <input
                    type="email"
                    required
                    placeholder={t.placeholderYourEmail}
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                  />
                </Field>
              </div>

              <Field label={t.projectUrl} isRtl={isRtl}>
                <input
                  type="url"
                  required
                  placeholder={t.placeholderUrl}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                />
              </Field>
              <Field label={t.projectName} isRtl={isRtl}>
                <input
                  type="text"
                  required
                  placeholder={t.placeholderName}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                />
              </Field>
              <Field label={t.oneLine} isRtl={isRtl}>
                <input
                  type="text"
                  required
                  placeholder={t.placeholderPitch}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition"
                />
              </Field>
              <Field label={t.program} isRtl={isRtl}>
                <select
                  required
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as SegmentKey)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-white/40 transition appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-coded-navy">
                    {t.selectProgram}
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
                <span>{t.consent}</span>
              </label>

              {errorMsg && (
                <p className="text-sm text-red-300">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-lg bg-white hover:bg-white/90 disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] py-4"
              >
                {status === "submitting" ? t.submitting : t.submitBtn}
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

// Decorative brace flanking the PROJECT SHOWCASE wordmark. Renders the
// glyph in CODED Brand Blue with a layered text-shadow that suggests the
// chrome/glass treatment from the brand book without needing a 3D asset.
function Brace({ char, className }: { char: "{" | "}"; className?: string }) {
  return (
    <span
      aria-hidden
      className={`font-extrabold select-none ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(180deg, #5fa2ff 0%, #2566c8 35%, #004AA3 60%, #062b6a 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow:
          "0 0 60px rgba(0,74,163,0.55), 0 0 20px rgba(98,255,229,0.20)",
        // Slight depth via a subtle horizontal scale + the gradient — gives
        // each brace a little weight without a 3D asset.
        transform: char === "{" ? "translateY(-4%) scaleX(1.05)" : "translateY(-4%) scaleX(1.05)",
      }}
    >
      {char}
    </span>
  );
}

function Field({
  label,
  children,
  isRtl,
}: {
  label: string;
  children: React.ReactNode;
  isRtl: boolean;
}) {
  return (
    <label className="block">
      <span
        className={`block text-xs uppercase tracking-[0.25em] text-white/60 mb-2 ${
          isRtl ? "tracking-normal text-sm" : ""
        }`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

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
