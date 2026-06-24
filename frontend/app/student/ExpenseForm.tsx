"use client";

import { useState, FormEvent } from "react";
import { api, ApiClientError } from "@/lib/api";
import { Card, CardBody, Field, Input, Select, Textarea } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { CATEGORY_LABELS } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { ExpenseCategory } from "@/lib/types";
import { Plus } from "lucide-react";

const CATEGORIES: ExpenseCategory[] = ["food", "books", "rent", "transport", "fees", "other"];

export function ExpenseForm({ onAdded }: { onAdded: () => void }) {
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/expenses", { category, amount: numericAmount, note });
      setAmount("");
      setNote("");
      setSuccess(true);
      track("expense_added", { category, amount: numericAmount });
      onAdded();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't save that expense.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <p className="font-display text-lg text-ink mb-4">Log an expense</p>
        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}
        {success && (
          <p className="text-sm text-ledger mb-3 animate-riseIn">Expense logged.</p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
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
              placeholder="50"
            />
          </Field>
          <Field label="Note" hint="Optional">
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lunch with classmates"
            />
          </Field>
          <Button type="submit" disabled={submitting} className="self-start">
            <Plus size={14} />
            {submitting ? "Saving…" : "Add expense"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
