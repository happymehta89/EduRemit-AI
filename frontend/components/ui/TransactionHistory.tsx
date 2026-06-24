"use client";

import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Primitives";
import { EmptyState, PageLoading } from "@/components/ui/Feedback";
import { formatXLM, formatDate, horizonExplorerUrl, truncateHash } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { ExternalLink, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function TransactionHistory() {
  const { user } = useAuth();
  const { data, loading } = useFetch(() => api.get<{ transactions: Transaction[] }>("/transactions"), []);

  if (loading) return <PageLoading />;

  const transactions = data?.transactions || [];

  return (
    <Card className="mt-8">
      <CardBody className="pt-5">
        <p className="font-display text-xl text-ink mb-4">Payment History</p>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Your payment history will appear here." />
        ) : (
          <ul className="flex flex-col">
            {transactions.map((tx, i) => {
              // sender can be a populated object or a string depending on how it's populated.
              const isSender = typeof tx.sender === "object" ? tx.sender._id === user?._id : tx.sender === user?._id;
              const otherParty = typeof (isSender ? tx.receiver : tx.sender) === "object" 
                ? (isSender ? tx.receiver : tx.sender) as { name: string, role: string }
                : { name: "Unknown", role: "" };

              return (
                <li
                  key={tx._id}
                  className={`flex items-center justify-between gap-3 py-4 ${i > 0 ? "border-t border-hairline" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSender ? "bg-rust/10 text-rust" : "bg-ledger/10 text-ledger"}`}>
                      {isSender ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate font-medium">
                        {isSender ? "Sent to" : "Received from"} {otherParty.name}
                        {tx.memo && <span className="text-sand font-normal"> · {tx.memo}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-sand">{formatDate(tx.createdAt)}</span>
                        <a
                          href={horizonExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-sand hover:text-ledger transition-colors flex items-center gap-1"
                          title="View on Stellar Explorer"
                        >
                          {truncateHash(tx.hash)}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className={`font-mono text-sm tabular font-medium ${isSender ? "text-ink" : "text-green-600"}`}>
                      {isSender ? "-" : "+"}{formatXLM(tx.amount)}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-sand mt-0.5">
                      {tx.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
