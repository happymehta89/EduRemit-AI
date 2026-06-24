export type Role = "parent" | "student" | "university";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  walletPublicKey: string | null;
  linkedStudents?: string[] | StudentSummary[];
  linkedParent?: string | null;
  universityName?: string | null;
  onboardingFeedback?: {
    rating: number | null;
    comment: string | null;
    submittedAt: string | null;
  };
  createdAt?: string;
}

export interface StudentSummary {
  _id: string;
  name: string;
  email: string;
  walletPublicKey: string | null;
}

export interface University {
  _id: string;
  name: string;
  universityName: string | null;
  walletPublicKey: string | null;
  email: string;
}

export type ExpenseCategory = "food" | "books" | "rent" | "transport" | "fees" | "other";

export interface Expense {
  _id: string;
  studentId: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  spentAt: string;
  createdAt: string;
}

export type TransactionType = "funding" | "tuition" | "rent" | "other";
export type TransactionStatus = "pending" | "success" | "failed";

export interface Transaction {
  _id: string;
  sender: { _id: string; name: string; role: Role } | string;
  receiver: { _id: string; name: string; role: Role } | string;
  senderWallet: string;
  receiverWallet: string;
  amount: number;
  asset: string;
  hash: string;
  type: TransactionType;
  memo: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface CategoryBreakdownEntry {
  amount: number;
  percent: number;
}

export interface AIReport {
  _id: string;
  studentId: string;
  summary: string;
  insights: string[];
  riskLevel: "low" | "medium" | "high";
  categoryBreakdown: Record<string, CategoryBreakdownEntry>;
  generatedBy: "gemini" | "rule-based";
  createdAt: string;
}

export interface WalletInfo {
  publicKey: string;
  balance: number;
  exists: boolean;
}

export interface WalletHistoryItem {
  id: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  createdAt: string;
  transactionHash: string;
}

export interface StudentFinancialSummary {
  totalSent: number;
  totalSpent: number;
  remainingBalance: number;
  categoryBreakdown: Record<string, number>;
}

export interface ApiError {
  error: string;
  detail?: unknown;
}
