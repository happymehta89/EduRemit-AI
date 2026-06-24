"use client";

import { useRequireRole } from "@/hooks/useRequireRole";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { DashboardShell, PageTitle } from "@/components/layout/DashboardShell";
import { PageLoading, EmptyState } from "@/components/ui/Feedback";
import { Card, CardBody } from "@/components/ui/Primitives";
import { TransactionStamp } from "@/components/ui/Stamp";
import {
  formatXLM,
  formatDateTime,
  truncateWallet,
  horizonExplorerUrl,
  truncateHash,
} from "@/lib/format";
import type { WalletInfo, Transaction } from "@/lib/types";
import { ExternalLink } from "lucide-react";

export default function UniversityDashboard() {
  const { user, loading: authLoading } = useRequireRole("university");
  const { data: walletData } = useFetch(() => api.get<WalletInfo>("/wallet"), []);
  const { data: paymentsData, loading: paymentsLoading } = useFetch(
    () => api.get<{ payments: Transaction[] }>("/directory/university-payers"),
    []
  );

  if (authLoading) return <PageLoading />;

  const payments = paymentsData?.payments || [];
  const totalReceived = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0);

  // group by payer
  const byPayer = new Map<string, { name: string; total: number; count: number }>();
  for (const p of payments) {
    const sender = typeof p.sender === "object" ? p.sender : null;
    const key = sender?._id || "unknown";
    const existing = byPayer.get(key) || { name: sender?.name || "Unknown", total: 0, count: 0 };
    existing.total += p.amount;
    existing.count += 1;
    byPayer.set(key, existing);
  }

  return (
    <DashboardShell>
      <PageTitle
        eyebrow="University"
        title={user!.universityName || user!.name}
        description="Every tuition and rent payment lands here with its sender and Stellar settlement proof attached."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Total received</p>
            <p className="font-display text-2xl text-ink tabular">{formatXLM(totalReceived)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Payments recorded</p>
            <p className="font-display text-2xl text-ink tabular">{payments.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Wallet</p>
            <p className="font-mono text-xs text-ink-soft mt-2 truncate">
              {truncateWallet(walletData?.publicKey || user!.walletPublicKey)}
            </p>
          </CardBody>
        </Card>
      </div>

      {byPayer.size > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-xl text-ink mb-4">Payers</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {Array.from(byPayer.entries()).map(([id, payer]) => (
              <Card key={id}>
                <CardBody className="pt-4">
                  <p className="text-sm text-ink font-medium truncate">{payer.name}</p>
                  <p className="font-mono text-lg text-ink tabular mt-1">{formatXLM(payer.total)}</p>
                  <p className="text-xs text-sand">{payer.count} payment{payer.count !== 1 ? "s" : ""}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl text-ink mb-4">Payment log</h2>
        <Card>
          <CardBody className="pt-5">
            {paymentsLoading ? (
              <PageLoading />
            ) : payments.length === 0 ? (
              <EmptyState
                title="No payments yet"
                description="Once a student pays tuition or rent, it will show up here with full settlement proof."
              />
            ) : (
              <ul className="flex flex-col">
                {payments.map((p, i) => {
                  const sender = typeof p.sender === "object" ? p.sender : null;
                  return (
                    <li
                      key={p._id}
                      className={`flex items-center justify-between gap-3 py-3.5 flex-wrap ${
                        i > 0 ? "ledger-rule" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ink font-medium">{sender?.name || "Unknown payer"}</p>
                        <p className="text-xs text-sand capitalize">
                          {p.type} · {formatDateTime(p.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-ink tabular">{formatXLM(p.amount)}</span>
                        <TransactionStamp status={p.status} />
                        <a
                          href={horizonExplorerUrl(p.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-sand hover:text-ledger flex items-center gap-1"
                        >
                          {truncateHash(p.hash, 6, 4)}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </DashboardShell>
  );
}
