"use client";

import { useState, FormEvent } from "react";
import { useFetch } from "@/hooks/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { signTransaction, isAllowed, requestAccess, getAddress } from "@stellar/freighter-api";
import { depositToContract } from "@/lib/stellar-contract";
import { Field, Input } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner } from "@/components/ui/Feedback";
import { StellarStamp } from "@/components/ui/Stamp";
import { formatXLM, CATEGORY_LABELS, CATEGORY_COLORS, horizonExplorerUrl, truncateHash } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { StudentSummary, StudentFinancialSummary } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Send, ExternalLink } from "lucide-react";

export function StudentSpendingPanel({ student }: { student: StudentSummary }) {
  const { data: summary, loading, reload } = useFetch<StudentFinancialSummary>(
    () => api.get(`/transactions/summary/${student._id}`),
    [student._id]
  );

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("Education funding");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLastHash(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Ensure Freighter is connected
      if (!(await isAllowed())) {
        await requestAccess();
      }

      // 2. Retrieve Parent's wallet address
      const parentAddressObj = await getAddress();
      const parentAddress = typeof parentAddressObj === "string" ? parentAddressObj : parentAddressObj.address;
      if (!parentAddress) {
        throw new Error("Could not retrieve parent wallet address. Make sure Freighter is unlocked.");
      }

      // 3. Retrieve Student's wallet address
      if (!student.walletPublicKey) {
        throw new Error("The student has not linked their Freighter wallet yet.");
      }

      // 4. Call Soroban deposit method on the contract
      const depositResult = await depositToContract(parentAddress, student.walletPublicKey, numericAmount);

      // 5. Submit transaction hash to the backend to log in the database
      const result = await api.post<{ stellarHash: string }>("/transactions/fund", {
        studentId: student._id,
        amount: numericAmount,
        memo,
        transactionHash: depositResult.hash,
      });
      
      setLastHash(result.stellarHash);
      setAmount("");
      track("funds_sent", { amount: numericAmount, studentId: student._id });
      reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : (err as Error).message || "The transfer failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const chartData = summary
    ? Object.entries(summary.categoryBreakdown).map(([category, value]) => ({
        name: CATEGORY_LABELS[category] || category,
        value,
        color: CATEGORY_COLORS[category] || "#8B8378",
      }))
    : [];

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {/* Send funds */}
      <div>
        <p className="text-xs uppercase tracking-wider text-sand mb-3">Send funds</p>
        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}
        {lastHash && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-ledger/25 bg-ledger-light px-3 py-2.5 animate-riseIn">
            <StellarStamp animate size="sm" />
            <a
              href={horizonExplorerUrl(lastHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-ledger-dark hover:underline flex items-center gap-1"
            >
              {truncateHash(lastHash)}
              <ExternalLink size={11} />
            </a>
          </div>
        )}
        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <Field label="Amount (XLM)">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
            />
          </Field>
          <Field label="Memo">
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={28} />
          </Field>
          <Button type="submit" disabled={submitting} className="self-start">
            <Send size={14} />
            {submitting ? "Sending…" : `Send to ${student.name.split(" ")[0]}`}
          </Button>
        </form>
      </div>

      {/* Monitoring */}
      <div>
        <p className="text-xs uppercase tracking-wider text-sand mb-3">Spending summary</p>
        {loading ? (
          <div className="flex items-center text-sand py-6">
            <Spinner className="mr-2" /> Loading…
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-sand">Total sent</p>
                <p className="font-display text-lg text-ink tabular">{formatXLM(summary.totalSent)}</p>
              </div>
              <div>
                <p className="text-xs text-sand">Remaining (est.)</p>
                <p className="font-display text-lg text-ink tabular">{formatXLM(summary.remainingBalance)}</p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" innerRadius={28} outerRadius={48} paddingAngle={2}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatXLM(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex flex-col gap-1 text-xs">
                  {chartData.map((entry, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-ink-soft">{entry.name}</span>
                      <span className="text-sand tabular">{formatXLM(entry.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-sand">No expenses logged by this student yet.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
