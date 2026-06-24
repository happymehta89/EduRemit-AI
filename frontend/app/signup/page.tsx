"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth, ApiClientError } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Primitives";
import { ErrorBanner } from "@/components/ui/Feedback";
import type { Role } from "@/lib/types";
import clsx from "clsx";
import { Wallet, Receipt, GraduationCap } from "lucide-react";

const ROLES: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "parent", label: "Parent", description: "I send education funds", icon: <Wallet size={18} /> },
  { value: "student", label: "Student", description: "I receive funds & track spending", icon: <Receipt size={18} /> },
  { value: "university", label: "University", description: "I receive tuition payments", icon: <GraduationCap size={18} /> },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [walletNote, setWalletNote] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setWalletNote(true);
    try {
      await signup({
        name,
        email,
        password,
        role,
        universityName: role === "university" ? universityName : undefined,
        parentEmail: role === "student" ? parentEmail || undefined : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't create your account. Please try again.");
      setWalletNote(false);
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
        <div className="w-full max-w-md">
          <p className="text-xs uppercase tracking-wider text-ledger font-medium mb-1.5">Get started</p>
          <h1 className="font-display text-3xl text-ink mb-6">Open an account</h1>

          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-ink-soft mb-2 block">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={clsx(
                      "flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-center transition-colors",
                      role === r.value
                        ? "border-ledger bg-ledger-light text-ledger-dark"
                        : "border-ink/15 text-ink-soft hover:border-ink/30"
                    )}
                  >
                    {r.icon}
                    <span className="text-xs font-medium">{r.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-sand mt-2">{ROLES.find((r) => r.value === role)?.description}</p>
            </div>

            <Field label="Full name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" />
            </Field>

            {role === "university" && (
              <Field label="University name">
                <Input
                  required
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="Global Tech University"
                />
              </Field>
            )}

            {role === "student" && (
              <Field
                label="Parent's email"
                hint="Optional — links your account so they can send you funds right away. You can also link this later."
              >
                <Input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                />
              </Field>
            )}

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

            <Field label="Password" hint="At least 6 characters">
              <Input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {walletNote && submitting && (
              <p className="text-xs text-ledger animate-riseIn">
                Generating and funding your Stellar testnet wallet — this takes a few seconds…
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-sand mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-ledger font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
