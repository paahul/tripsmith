"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send link");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-baseline justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-terracotta">
              Sign in
            </p>
            <h1 className="font-serif text-4xl font-light text-ink">
              Save your trips.
            </h1>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-terracotta">
            ← home
          </Link>
        </div>

        <p className="mb-8 font-serif text-lg font-light italic leading-snug text-ink-2">
          A one-time email link. No password to remember.
        </p>

        {status === "sent" ? (
          <div className="rounded border border-line bg-paper p-6">
            <p className="font-serif text-xl text-ink">Check your email.</p>
            <p className="mt-2 text-sm text-ink-2">
              We sent a sign-in link to{" "}
              <span className="font-mono">{email}</span>. Click it to come back
              signed in.
            </p>
            <p className="mt-4 text-xs italic text-muted">
              Didn&rsquo;t arrive? Check spam, or{" "}
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="text-terracotta underline-offset-4 hover:underline"
              >
                try a different email
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-2">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded border border-line bg-paper px-3 py-2 text-base placeholder:text-muted/60 focus:border-terracotta focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded bg-terracotta px-6 py-2.5 text-sm font-medium text-cream hover:bg-terracotta-deep disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send link"}
            </button>
            {error && (
              <p className="text-sm text-terracotta-deep">{error}</p>
            )}
          </form>
        )}

        <p className="mt-10 text-xs italic text-muted">
          tripsmith only stores your email and the trips you plan. Profile data
          is kept on this device for now.
        </p>
      </div>
    </main>
  );
}
