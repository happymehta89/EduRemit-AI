"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="font-display italic text-2xl text-ink mb-3">Something went wrong</p>
        <p className="text-sm text-ink-soft mb-6">
          That's on us, not you. Try again, and if it keeps happening, refresh the page.
        </p>
        <button
          onClick={reset}
          className="bg-ledger text-paper px-5 py-2.5 rounded text-sm font-medium hover:bg-ledger-dark transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
