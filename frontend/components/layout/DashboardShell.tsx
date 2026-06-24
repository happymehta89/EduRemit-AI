"use client";

import { useAuth } from "@/lib/auth";
import { truncateWallet } from "@/lib/format";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FeedbackWidget } from "./FeedbackWidget";
import { ConnectWallet } from "@/components/ui/ConnectWallet";

const ROLE_DOCUMENT_LABEL: Record<string, string> = {
  parent: "Remittance Ledger",
  student: "Monthly Passbook",
  university: "Registrar's Payment Log",
};

export function DashboardShell({
  children,
  rightSlot,
}: {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-hairline bg-paper sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-display italic text-xl text-ink whitespace-nowrap">EduRemit</span>
            {user && (
              <span className="hidden sm:inline text-xs uppercase tracking-wider text-sand truncate">
                {ROLE_DOCUMENT_LABEL[user.role]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {rightSlot}
            <FeedbackWidget />
            <ConnectWallet />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
              aria-label="Log out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-xs uppercase tracking-wider text-ledger font-medium mb-1.5">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-2">{title}</h1>
      {description && <p className="text-sand text-sm max-w-2xl">{description}</p>}
    </div>
  );
}
