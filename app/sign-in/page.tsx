"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CodedLogo } from "@/components/CodedLogo";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/queue";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-8 py-5">
        <Link href="/">
          <CodedLogo width={90} />
        </Link>
      </header>
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-aiapp-aqua mb-3">
            Admin access
          </p>
          <h1 className="text-3xl font-extrabold mb-6">Sign in</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.25em] text-white/60 mb-2">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-aiapp-cyan transition"
              />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-[0.25em] text-white/60 mb-2">
                Password
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-aiapp-cyan transition"
              />
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-aiapp-primary hover:bg-aiapp-cyan disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] py-3 text-sm"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-white/60 mt-6">
            No account?{" "}
            <Link href="/sign-up" className="text-aiapp-aqua hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
