"use client";

import { Card, CardBody } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { formatXLM, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export function SpendingChart({ expenses }: { expenses: Expense[] }) {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  }
  const data = Object.entries(totals)
    .map(([category, amount]) => ({
      category: CATEGORY_LABELS[category] || category,
      amount,
      color: CATEGORY_COLORS[category] || "#8B8378",
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardBody className="pt-5">
        <p className="font-display text-lg text-ink mb-4">Spending by category</p>
        {data.length === 0 ? (
          <EmptyState title="No spending yet" description="Log an expense to see your breakdown here." />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#E2DCCE" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#8B8378" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "#1C2B33" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip formatter={(v: number) => formatXLM(v)} cursor={{ fill: "#F1ECE2" }} />
                <Bar dataKey="amount" radius={[0, 3, 3, 0]} barSize={18}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
