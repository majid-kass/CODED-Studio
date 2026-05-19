"use client";

import { useState } from "react";
import { PhoneMockup } from "./PhoneMockup";
import type { SegmentKey } from "@/lib/brandTheme";

type Submission = {
  id: string;
  url: string;
  name: string;
  createdAt: string;
  headline: string;
  caption: string;
  hashtags: string[];
  segment?: SegmentKey;
};

type Props = {
  submission: Submission;
  screenshotSrc: string;
  hasScreenshot: boolean;
};

type FormatKey = "image" | "carousel" | "reel";

const FORMATS: { key: FormatKey; label: string; endpoint: (id: string) => string; ext: string }[] = [
  { key: "image", label: "Image", endpoint: (id) => `/api/render/${id}`, ext: "png" },
  { key: "carousel", label: "Carousel", endpoint: (id) => `/api/render-carousel/${id}`, ext: "zip" },
  { key: "reel", label: "Reel", endpoint: (id) => `/api/render-video/${id}`, ext: "mp4" },
];

export function SubmissionCard({ submission, screenshotSrc, hasScreenshot }: Props) {
  const [selected, setSelected] = useState<Record<FormatKey, boolean>>({
    image: true,
    carousel: true,
    reel: true,
  });
  const [busy, setBusy] = useState<Record<FormatKey, boolean>>({
    image: false,
    carousel: false,
    reel: false,
  });
  const [screenshotReady, setScreenshotReady] = useState(hasScreenshot);
  const [warming, setWarming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = new Date(submission.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const safeName = submission.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const anyBusy = warming || Object.values(busy).some(Boolean);
  const anySelected = Object.values(selected).some(Boolean);

  function filenameFor(ext: string) {
    return ext === "zip"
      ? `${safeName || "post"}-coded-carousel.zip`
      : `${safeName || "post"}-coded.${ext}`;
  }

  async function downloadFormat(fmt: typeof FORMATS[number]) {
    setBusy((b) => ({ ...b, [fmt.key]: true }));
    try {
      const res = await fetch(fmt.endpoint(submission.id));
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `${fmt.label} render failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filenameFor(fmt.ext);
      link.href = objectUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } finally {
      setBusy((b) => ({ ...b, [fmt.key]: false }));
    }
  }

  async function handleGenerate() {
    if (!anySelected || anyBusy) return;
    setError(null);

    // Warm the screenshot cache first so the three renders below don't all
    // race to call Microlink in parallel.
    if (!screenshotReady) {
      setWarming(true);
      try {
        const res = await fetch(`/api/screenshot?id=${submission.id}`);
        if (!res.ok) {
          const detail = (await res.text().catch(() => "")).slice(0, 200);
          throw new Error(
            `Screenshot capture failed (${res.status})${detail ? ` — ${detail}` : ""}`
          );
        }
        setScreenshotReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Screenshot capture failed");
        setWarming(false);
        return;
      }
      setWarming(false);
    }

    const todo = FORMATS.filter((f) => selected[f.key]);
    const results = await Promise.allSettled(todo.map(downloadFormat));
    const firstFail = results.find((r) => r.status === "rejected");
    if (firstFail && firstFail.status === "rejected") {
      const reason = firstFail.reason;
      setError(reason instanceof Error ? reason.message : "One or more renders failed");
    }
  }

  return (
    <article className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{submission.name}</h3>
            <a
              href={submission.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-aiapp-aqua hover:underline"
            >
              {submission.url}
            </a>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            {date}
          </span>
        </div>
      </div>

      <div className="px-6">
        <div className="mx-auto max-w-[340px]">
          {screenshotReady ? (
            <PhoneMockup
              screenshotUrl={screenshotSrc}
              headline={submission.headline}
              projectName={submission.name}
              segment={submission.segment}
            />
          ) : (
            <ScreenshotPlaceholder warming={warming} segment={submission.segment} />
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">
            Caption
          </p>
          <p className="whitespace-pre-wrap text-sm text-white/85 leading-relaxed">
            {submission.caption}
          </p>
          <p className="text-sm text-aiapp-aqua mt-3">
            {submission.hashtags.join(" ")}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
            Generate
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => (
              <FormatCheckbox
                key={f.key}
                label={f.label}
                checked={selected[f.key]}
                busy={busy[f.key]}
                disabled={anyBusy}
                onChange={(v) => setSelected((s) => ({ ...s, [f.key]: v }))}
              />
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={anyBusy || !anySelected}
            className="w-full rounded-lg bg-aiapp-primary hover:bg-aiapp-cyan disabled:opacity-50 disabled:cursor-not-allowed transition text-coded-navy font-bold uppercase tracking-[0.2em] text-[11px] py-3"
          >
            {warming
              ? "Capturing screenshot…"
              : anyBusy
              ? "Rendering…"
              : screenshotReady
              ? "Generate selected"
              : "Capture & generate"}
          </button>
          {error && (
            <p className="text-xs text-red-300 text-center">{error}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function FormatCheckbox({
  label,
  checked,
  busy,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  busy: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-center gap-2 rounded-lg border border-white/10 px-2 py-3 cursor-pointer transition ${
        checked ? "bg-white/[0.06] border-aiapp-aqua/40" : "bg-transparent hover:bg-white/[0.04]"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input
        type="checkbox"
        className="accent-aiapp-aqua"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
        {busy ? "…" : label}
      </span>
    </label>
  );
}

function ScreenshotPlaceholder({ warming, segment: _segment }: { warming: boolean; segment?: SegmentKey }) {
  return (
    <div className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl flex items-center justify-center bg-white/[0.03] border border-dashed border-white/15">
      <div className="text-center px-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
          {warming ? "Capturing…" : "Screenshot pending"}
        </p>
        <p className="text-xs text-white/40 leading-relaxed">
          {warming
            ? "Microlink is fetching the page."
            : "Click Generate to capture the screenshot and render the selected formats."}
        </p>
      </div>
    </div>
  );
}
