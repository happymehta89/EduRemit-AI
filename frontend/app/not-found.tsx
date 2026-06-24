import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="font-display italic text-5xl text-ink mb-4">404</p>
        <p className="text-ink-soft mb-6">
          This page isn't in the ledger. It may have moved, or the entry never existed.
        </p>
        <Link href="/" className="text-ledger font-medium hover:underline">
          Back to EduRemit
        </Link>
      </div>
    </div>
  );
}
