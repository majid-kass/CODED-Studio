"use client";

import { useState } from "react";
import { PhoneMockup } from "./PhoneMockup";

type Submission = {
  id: string;
  url: string;
  name: string;
  createdAt: string;
  headline: string;
  caption: string;
  hashtags: string[];
};

type Props = {
  submission: Submission;
  screenshotSrc: string;
};

export function SubmissionCard({ submission, screenshotSrc }: Props) {
  const [imgDownloading, setImgDownloading] = useState(false);
  const [vidDownloading, setVidDownloading] = useState(false);
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

  async function download(
    endpoint: string,
    ext: string,
    setLoading: (v: boolean) => void
  ) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Render failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeName || "post"}-coded.${ext}`;
      link.href = objectUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
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
          <PhoneMockup
            screenshotUrl={screenshotSrc}
            headline={submission.headline}
            projectName={submission.name}
          />
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

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => download(`/api/render/${submission.id}`, "png", setImgDownloading)}
            disabled={imgDownloading || vidDownloading}
            className="flex-1 rounded-lg bg-aiapp-primary hover:bg-aiapp-cyan disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] text-xs py-3"
          >
            {imgDownloading ? "Generating…" : "Download image"}
          </button>
          <button
            onClick={() => download(`/api/render-video/${submission.id}`, "mp4", setVidDownloading)}
            disabled={imgDownloading || vidDownloading}
            className="flex-1 rounded-lg bg-aiapp-cyan/80 hover:bg-aiapp-cyan disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] text-xs py-3"
            title="~30s render"
          >
            {vidDownloading ? "Rendering video…" : "Download video"}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-300 text-center">{error}</p>
        )}
      </div>
    </article>
  );
}
