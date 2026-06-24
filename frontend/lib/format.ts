export function formatXLM(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`;
}

export function truncateWallet(address: string | null | undefined, lead = 6, tail = 6): string {
  if (!address) return "—";
  if (address.length <= lead + tail) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function truncateHash(hash: string, lead = 8, tail = 6): string {
  if (hash.length <= lead + tail) return hash;
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  books: "Books",
  rent: "Rent",
  transport: "Transport",
  fees: "Fees",
  other: "Other",
};

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#C4622D",
  books: "#3D6B5C",
  rent: "#1C2B33",
  transport: "#8B8378",
  fees: "#7A9E8E",
  other: "#D9A05B",
};

export function horizonExplorerUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}
