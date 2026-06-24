"use client";

import { useState, FormEvent } from "react";
import { useFetch } from "@/hooks/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { signTransaction, isAllowed, requestAccess } from "@stellar/freighter-api";
import { Card, CardBody, Field, Input, Select } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, PageLoading } from "@/components/ui/Feedback";
import { StellarStamp } from "@/components/ui/Stamp";
import { horizonExplorerUrl, truncateHash } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { University } from "@/lib/types";
import { GraduationCap, ExternalLink } from "lucide-react";

export function PayUniversityForm({ onPaid }: { onPaid: () => void }) {
  const { data, loading } = useFetch(() => api.get<{ universities: University[] }>("/directory/universities"), []);
  const [universityId, setUniversityId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"tuition" | "rent">("tuition");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);

  const universities = data?.universities || [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLastHash(null);
    const numericAmount = Number(amount);
    if (!universityId) {
      setError("Choose a university to pay.");
      return;
    }
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

      const memoText = type === "tuition" ? "Tuition payment" : "Rent payment";

      // 2. Get the unsigned XDR from the backend
      const { xdr } = await api.post<{ xdr: string }>("/transactions/build-tuition", {
        universityId,
        amount: numericAmount,
        memo: memoText,
      });

      // 3. Sign the XDR with Freighter
      const signResult = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
      if (signResult.error) {
          throw new Error(signResult.error as string);
      }

      // 4. Submit the signed XDR to the backend
      const result = await api.post<{ stellarHash: string }>("/transactions/pay-university", {
        universityId,
        amount: numericAmount,
        type,
        memo: memoText,
        signedXDR: signResult.signedTxXdr,
      });
      
      setLastHash(result.stellarHash);
      setAmount("");
      track("payment_completed", { type, amount: numericAmount, universityId });
      onPaid();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : (err as Error).message || "The payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading />;

  return (
    <Card className="max-w-md">
      <CardBody className="pt-5">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={18} className="text-ledger" />
          <p className="font-display text-lg text-ink">Pay your university</p>
        </div>

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

        {universities.length === 0 ? (
          <p className="text-sm text-sand">No universities are registered yet.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="University">
              <Select value={universityId} onChange={(e) => setUniversityId(e.target.value)}>
                <option value="">Select a university…</option>
                {universities.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.universityName || u.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Payment type">
              <Select value={type} onChange={(e) => setType(e.target.value as "tuition" | "rent")}>
                <option value="tuition">Tuition</option>
                <option value="rent">Rent</option>
              </Select>
            </Field>
            <Field label="Amount (XLM)">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="200"
              />
            </Field>
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Sending payment…" : "Pay now"}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
