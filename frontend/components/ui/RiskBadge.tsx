import clsx from "clsx";

const RISK_STYLES = {
  low: "bg-ledger-light text-ledger-dark",
  medium: "bg-rust-light text-rust",
  high: "bg-rust text-paper",
};

const RISK_LABELS = {
  low: "On track",
  medium: "Worth a look",
  high: "Needs attention",
};

export function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        RISK_STYLES[level]
      )}
    >
      {RISK_LABELS[level]}
    </span>
  );
}
