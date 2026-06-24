import { AlertCircle, Inbox } from "lucide-react";
import clsx from "clsx";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-rust/25 bg-rust-light px-4 py-3 text-sm text-ink">
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rust" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-12 px-6">
      <Inbox size={28} className="text-sand/60 mb-1" />
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <p className="text-sm text-sand max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx("animate-spin", className)}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-sand">
      <Spinner className="mr-2" />
      <span className="text-sm">Loading…</span>
    </div>
  );
}
