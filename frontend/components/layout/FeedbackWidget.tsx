"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Primitives";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Star, MessageSquare, X } from "lucide-react";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Pick a rating first.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/feedback", { rating, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
        aria-label="Give feedback"
      >
        <MessageSquare size={15} />
        <span className="hidden sm:inline">Feedback</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
      <div
        className="bg-paper rounded-md border border-hairline shadow-stamp p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg text-ink">Quick feedback</p>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-sand hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <p className="text-sm text-ledger py-4">Thanks — this helps a lot.</p>
        ) : (
          <>
            {error && (
              <div className="mb-3">
                <ErrorBanner message={error} />
              </div>
            )}
            <p className="text-sm text-ink-soft mb-2">How's your experience so far?</p>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}>
                  <Star
                    size={24}
                    className={n <= rating ? "fill-rust text-rust" : "text-hairline"}
                  />
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anything that worked well, or didn't? (optional)"
              className="mb-4"
            />
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Sending…" : "Send feedback"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
