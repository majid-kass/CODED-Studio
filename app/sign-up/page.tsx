"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/queue` : undefined,
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // If the Supabase project has email confirmation OFF, the user is signed in
    // immediately and gets a session — push them to the queue. If it's ON, they
    // need to click the email link first.
    if (data.session) {
      router.push("/queue");
      router.refresh();
    } else {
      setInfo("Check your email for the confirmation link to finish signing up.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-8 py-5">
        <Link href="/">
          <Image
            src="/brand/coded-logo-white.png"
            alt="CODED"
            width={90}
            height={32}
            style={{ height: "auto" }}
            priority
          />
        </Link>
      </header>
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-aiapp-aqua mb-3">
            Admin access
          </p>
          <h1 className="text-3xl font-extrabold mb-6">Create account</h1>
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
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-aiapp-cyan transition"
              />
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            {info && <p className="text-sm text-aiapp-aqua">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-aiapp-primary hover:bg-aiapp-cyan disabled:opacity-50 transition text-coded-navy font-bold uppercase tracking-[0.2em] py-3 text-sm"
            >
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="text-sm text-white/60 mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-aiapp-aqua hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
