"use client";

import { useState } from "react";
import { useRequireRole } from "@/hooks/useRequireRole";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { DashboardShell, PageTitle } from "@/components/layout/DashboardShell";
import { PageLoading } from "@/components/ui/Feedback";
import { Card, CardBody } from "@/components/ui/Primitives";
import { formatXLM, truncateWallet } from "@/lib/format";
import type { WalletInfo, Expense } from "@/lib/types";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseHistory } from "./ExpenseHistory";
import { SpendingChart } from "./SpendingChart";
import { PayUniversityForm } from "./PayUniversityForm";
import { BudgetAdvisor } from "./BudgetAdvisor";
import { TransactionHistory } from "@/components/ui/TransactionHistory";

export default function StudentDashboard() {
  const { user, loading: authLoading } = useRequireRole("student");
  const [tab, setTab] = useState<"overview" | "expenses" | "pay" | "advisor">("overview");

  const { data: walletData, reload: reloadWallet } = useFetch(() => api.get<WalletInfo>("/wallet"), []);
  const { data: expensesData, reload: reloadExpenses } = useFetch(
    () => api.get<{ expenses: Expense[] }>("/expenses"),
    []
  );

  if (authLoading) return <PageLoading />;

  const expenses = expensesData?.expenses || [];

  function refreshAll() {
    reloadWallet();
    reloadExpenses();
  }

  return (
    <DashboardShell>
      <PageTitle
        eyebrow="Student"
        title={`Welcome, ${user!.name.split(" ")[0]}`}
        description="Track what you've received, log every expense, and pay your university directly from your Stellar wallet."
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Wallet balance</p>
            <p className="font-display text-3xl text-ink tabular">
              {walletData ? formatXLM(walletData.balance) : "—"}
            </p>
            <p className="text-xs font-mono text-sand mt-1">{truncateWallet(user!.walletPublicKey)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Logged expenses</p>
            <p className="font-display text-3xl text-ink tabular">{expenses.length}</p>
            <p className="text-xs text-sand mt-1">
              {expenses.length > 0 ? "across all categories" : "log your first one below"}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex gap-1 mb-6 border-b border-hairline overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "expenses", label: "Log expense" },
          { id: "pay", label: "Pay university" },
          { id: "advisor", label: "AI advisor" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "border-ledger text-ink" : "border-transparent text-sand hover:text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <SpendingChart expenses={expenses} />
            <ExpenseHistory expenses={expenses.slice(0, 6)} onDeleted={refreshAll} compact />
          </div>
          <TransactionHistory />
        </div>
      )}

      {tab === "expenses" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <ExpenseForm onAdded={refreshAll} />
          <ExpenseHistory expenses={expenses} onDeleted={refreshAll} />
        </div>
      )}

      {tab === "pay" && <PayUniversityForm onPaid={refreshAll} />}

      {tab === "advisor" && <BudgetAdvisor hasExpenses={expenses.length > 0} />}
    </DashboardShell>
  );
}
