"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { formatXLM, formatDate, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { Trash2 } from "lucide-react";

export function ExpenseHistory({
  expenses,
  onDeleted,
  compact = false,
}: {
  expenses: Expense[];
  onDeleted: () => void;
  compact?: boolean;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/expenses/${id}`);
      onDeleted();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <p className="font-display text-lg text-ink mb-4">{compact ? "Recent expenses" : "All expenses"}</p>
        {expenses.length === 0 ? (
          <EmptyState title="No expenses yet" description="Logged expenses will appear here." />
        ) : (
          <ul className="flex flex-col">
            {expenses.map((exp, i) => (
              <li
                key={exp._id}
                className={`flex items-center justify-between gap-3 py-3 ${i > 0 ? "ledger-rule" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">
                      {CATEGORY_LABELS[exp.category]}
                      {exp.note && <span className="text-sand"> · {exp.note}</span>}
                    </p>
                    <p className="text-xs text-sand">{formatDate(exp.spentAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-sm text-ink tabular">{formatXLM(exp.amount)}</span>
                  {!compact && (
                    <button
                      onClick={() => handleDelete(exp._id)}
                      disabled={deletingId === exp._id}
                      className="text-sand hover:text-rust transition-colors"
                      aria-label="Delete expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
