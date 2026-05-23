import Link from "next/link";
import { listSubmissions } from "@/lib/store";
import { SubmissionCard } from "@/components/SubmissionCard";
import { SignOutButton } from "@/components/SignOutButton";
import { CodedLogo } from "@/components/CodedLogo";
import { screenshotUrl } from "@/lib/screenshot";
import { objectExists, shotKey } from "@/lib/storage";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  // Middleware already redirects unauthenticated users — this read is just so we
  // can greet the admin by email in the header.
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const submissions = await listSubmissions();
  // Cheaper "does it exist?" probe via Storage list() — we don't need to
  // download the bytes here, just whether a cached PNG already lives at
  // shots/{id}-mobile.png. The render routes do the real read on demand.
  const cards = await Promise.all(
    submissions.map(async (s) => ({
      submission: s,
      hasScreenshot: await objectExists(shotKey(s.id, "mobile")),
    }))
  );

  return (
    <main className="min-h-screen">
      <header className="px-6 sm:px-8 py-5 flex items-center justify-between gap-4 border-b border-white/5">
        <Link href="/" className="min-w-0">
          <CodedLogo width={90} />
        </Link>
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.25em] text-white/50 truncate max-w-[200px]">
              {user.email}
            </span>
          )}
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white transition whitespace-nowrap"
          >
            ← Submit form
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className="px-6 sm:px-8 pt-16 pb-8 text-center">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.5em] text-white/40 mb-4">
          Admin · CODED
        </p>
        <h1 className="font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-[clamp(48px,9vw,112px)]">
          Marketing Queue
        </h1>
        {submissions.length > 0 && (
          <p className="mt-5 text-sm text-white/55">
            {submissions.length}{" "}
            {submissions.length === 1 ? "submission" : "submissions"} awaiting review
          </p>
        )}
      </section>

      <section className="px-6 sm:px-8 py-12">
        {submissions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
            {cards.map(({ submission: s, hasScreenshot }) => (
              <SubmissionCard
                key={s.id}
                submission={s}
                screenshotSrc={screenshotUrl(s.url, s.id)}
                hasScreenshot={hasScreenshot}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-32 text-white/50">
      <p className="text-sm uppercase tracking-[0.3em] mb-3">Queue is empty</p>
      <p className="text-base">
        Submissions from{" "}
        <Link href="/" className="text-aiapp-aqua hover:underline">
          the form
        </Link>{" "}
        will land here, ready to review and post.
      </p>
    </div>
  );
}
