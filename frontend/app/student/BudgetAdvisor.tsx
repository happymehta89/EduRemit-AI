"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, PageLoading, EmptyState } from "@/components/ui/Feedback";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { formatDateTime } from "@/lib/format";
import type { AIReport } from "@/lib/types";
import { Sparkles, Bot } from "lucide-react";

export function BudgetAdvisor({ hasExpenses }: { hasExpenses: boolean }) {
  const { data, loading, setData } = useFetch(
    () => api.get<{ report: AIReport | null }>("/ai-reports/latest"),
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze() {
    setError(null);
    setAnalyzing(true);
    try {
      const result = await api.post<{ report: AIReport }>("/ai-reports/analyze");
      setData({ report: result.report });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't generate insights right now.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) return <PageLoading />;

  const report = data?.report;

  return (
    <Card className="max-w-2xl">
      <CardBody className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-ledger" />
            <p className="font-display text-lg text-ink">Budget advisor</p>
          </div>
          {report && <RiskBadge level={report.riskLevel} />}
        </div>

        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}

        {!hasExpenses ? (
          <EmptyState
            title="Nothing to analyze yet"
            description="Log a few expenses first, then come back here for personalized insights."
          />
        ) : !report ? (
          <div className="text-center py-6">
            <p className="text-sm text-sand mb-4">
              Get a breakdown of your spending with suggestions on where to cut back.
            </p>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              <Sparkles size={14} />
              {analyzing ? "Analyzing…" : "Analyze my spending"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink leading-relaxed">{report.summary}</p>
            <ul className="flex flex-col gap-2">
              {report.insights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-soft ledger-rule pt-2.5">
                  <span className="text-ledger flex-shrink-0">→</span>
                  {insight}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-sand">
                Generated {formatDateTime(report.createdAt)} ·{" "}
                {report.generatedBy === "gemini" ? "Gemini AI" : "Rule-based advisor"}
              </p>
              <Button variant="ghost" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? "Refreshing…" : "Refresh analysis"}
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
