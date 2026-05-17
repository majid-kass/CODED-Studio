import Image from "next/image";
import Link from "next/link";
import { listSubmissions } from "@/lib/store";
import { SubmissionCard } from "@/components/SubmissionCard";
import { screenshotUrl } from "@/lib/screenshot";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const submissions = await listSubmissions();

  return (
    <main className="min-h-screen">
      <header className="px-6 sm:px-8 py-5 flex items-center justify-between gap-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <Image
            src="/brand/coded-logo-white.png"
            alt="CODED"
            width={90}
            height={32}
            style={{ height: "auto" }}
            className="flex-shrink-0"
          />
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.25em] text-white/40 whitespace-nowrap">
            Marketing queue
          </span>
        </Link>
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-aiapp-aqua transition whitespace-nowrap"
        >
          ← Submit form
        </Link>
      </header>

      <section className="px-6 sm:px-8 py-12">
        {submissions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-7xl mx-auto">
            {submissions.map((s) => (
              <SubmissionCard
                key={s.id}
                submission={s}
                screenshotSrc={screenshotUrl(s.url, s.id)}
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
