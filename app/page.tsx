"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, name, pitch, consent }),
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
    <main className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-8 py-5 flex items-center justify-between">
        <Image
          src="/brand/coded-logo-white.png"
          alt="CODED"
          width={90}
          height={32}
          style={{ height: "auto" }}
          priority
        />
        <Link
          href="/queue"
          className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-aiapp-aqua transition whitespace-nowrap"
        >
          Admin →
        </Link>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-aiapp-aqua mb-3">
            AI App Developer Bootcamp
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.05] mb-4">
            Submit your project.
          </h1>
          <p className="text-white/70 mb-10 text-lg">
            Drop the link. We&apos;ll turn it into a ready-to-post Instagram package.
          </p>

          {status === "done" ? (
            <div className="rounded-2xl border border-aiapp-cyan/40 bg-aiapp-bg/40 p-8">
              <h2 className="text-2xl font-bold mb-2">Thanks — got it.</h2>
              <p className="text-white/70 mb-6">
                Your submission is in the queue. We&apos;ll review and post it from the CODED channels.
              </p>
              <button
                onClick={() => {
                  setUrl("");
                  setName("");
                  setPitch("");
                  setConsent(false);
                  setStatus("idle");
                }}
                className="text-sm uppercase tracking-[0.25em] text-aiapp-aqua hover:text-white transition"
              >
                Submit another →
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <Field label="Project URL">
                <input
                  type="url"
                  required
                  placeholder="https://your-project.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-aiapp-cyan transition"
                />
              </Field>
              <Field label="Project name">
                <input
                  type="text"
                  required
                  placeholder="Loft5 Booking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-aiapp-cyan transition"
                />
              </Field>
              <Field label="One line — what is it?">
                <input
                  type="text"
                  required
                  placeholder="An AI-powered event space booking platform"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-aiapp-cyan transition"
                />
              </Field>

              <label className="flex items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-aiapp-cyan"
                />
                <span>
                  You can use this project for CODED marketing (Instagram, web, etc.) with
                  credit.
                </span>
              </label>

              {errorMsg && (
                <p className="text-sm text-red-300">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-lg bg-aiapp-primary hover:bg-aiapp-cyan disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] py-4"
              >
                {status === "submitting" ? "Submitting…" : "Submit project"}
              </button>
            </form>
          )}
        </div>
      </section>
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
