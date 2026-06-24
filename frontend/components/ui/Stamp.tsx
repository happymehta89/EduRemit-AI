import { Check } from "lucide-react";
import clsx from "clsx";

/**
 * The wax-seal stamp — the page's signature element.
 * Appears next to any transaction that's been confirmed on Stellar testnet,
 * turning an abstract on-chain confirmation into something that reads with
 * the same instant trust as a stamped receipt.
 */
export function StellarStamp({ animate = false, size = "md" }: { animate?: boolean; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ledger text-ledger font-display italic select-none",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        animate && "animate-stampIn",
        !animate && "-rotate-3"
      )}
      style={{ transform: animate ? undefined : "rotate(-3deg)" }}
      title="Confirmed on the Stellar testnet ledger"
    >
      <Check size={size === "sm" ? 11 : 13} strokeWidth={3} />
      Settled on Stellar
    </span>
  );
}

export function PendingStamp() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-sand/50 text-sand px-2.5 py-1 text-xs font-display italic -rotate-3 select-none">
      Pending
    </span>
  );
}

export function FailedStamp() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-rust text-rust px-2.5 py-1 text-xs font-display italic -rotate-3 select-none">
      Failed
    </span>
  );
}

export function TransactionStamp({ status, animate }: { status: "pending" | "success" | "failed"; animate?: boolean }) {
  if (status === "success") return <StellarStamp animate={animate} />;
  if (status === "failed") return <FailedStamp />;
  return <PendingStamp />;
}
