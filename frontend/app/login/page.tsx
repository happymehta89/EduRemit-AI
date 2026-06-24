"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth, ApiClientError } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Primitives";
import { ErrorBanner } from "@/components/ui/Feedback";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="px-4 sm:px-6 py-5">
        <Link href="/" className="font-display italic text-xl text-ink">
          EduRemit
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-wider text-ledger font-medium mb-1.5">Welcome back</p>
          <h1 className="font-display text-3xl text-ink mb-6">Log in</h1>

          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="text-sm text-sand mt-6 text-center">
            New here?{" "}
            <Link href="/signup" className="text-ledger font-medium hover:underline">
              Create an account
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-hairline">
            <p className="text-xs text-sand text-center leading-relaxed">
              Demo accounts (after running the seed script): any <code className="font-mono">@eduremit.demo</code>{" "}
              email with password <code className="font-mono">Password123!</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
