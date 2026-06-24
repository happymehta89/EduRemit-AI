"use client";

import { useState, FormEvent } from "react";
import { api, ApiClientError } from "@/lib/api";
import { Card, CardBody, Field, Input } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";

export function LinkStudentForm({
  onLinked,
  onCancel,
}: {
  onLinked: () => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/link-student", { studentEmail: email });
      onLinked();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't link that student.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <p className="font-display text-lg text-ink mb-3">Link a student</p>
        {error && (
          <div className="mb-3">
            <ErrorBanner message={error} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Field label="Student's account email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} size="md">
              {submitting ? "Linking…" : "Link student"}
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
