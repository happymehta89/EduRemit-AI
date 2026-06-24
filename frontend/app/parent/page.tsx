"use client";

import { useState } from "react";
import { useRequireRole } from "@/hooks/useRequireRole";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { DashboardShell, PageTitle } from "@/components/layout/DashboardShell";
import { PageLoading, EmptyState } from "@/components/ui/Feedback";
import { Card, CardBody, CardHeader } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { formatXLM, truncateWallet } from "@/lib/format";
import type { StudentSummary, WalletInfo } from "@/lib/types";
import { UserPlus } from "lucide-react";
import { LinkStudentForm } from "./LinkStudentForm";
import { StudentSpendingPanel } from "./StudentSpendingPanel";
import { TransactionHistory } from "@/components/ui/TransactionHistory";

export default function ParentDashboard() {
  const { user, loading: authLoading } = useRequireRole("parent");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { data: studentsData, loading: studentsLoading, reload: reloadStudents } = useFetch(
    () => api.get<{ students: StudentSummary[] }>("/directory/students"),
    []
  );
  const { data: walletData } = useFetch(() => api.get<WalletInfo>("/wallet"), []);

  if (authLoading) return <PageLoading />;

  const students = studentsData?.students || [];

  return (
    <DashboardShell>
      <PageTitle
        eyebrow="Parent"
        title={`Welcome, ${user!.name.split(" ")[0]}`}
        description="Fund a linked student directly, and keep an eye on how it's being spent — every transfer settles on the Stellar testnet."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Your wallet balance</p>
            <p className="font-display text-2xl text-ink tabular">
              {walletData ? formatXLM(walletData.balance) : "—"}
            </p>
            <p className="text-xs font-mono text-sand mt-1">{truncateWallet(user!.walletPublicKey)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Linked students</p>
            <p className="font-display text-2xl text-ink tabular">{students.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="pt-5 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wider text-sand mb-1">Quick action</p>
            <button
              onClick={() => setShowLinkForm((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-ledger font-medium hover:underline"
            >
              <UserPlus size={14} />
              Link another student
            </button>
          </CardBody>
        </Card>
      </div>

      {showLinkForm && (
        <div className="mb-8">
          <LinkStudentForm
            onLinked={() => {
              reloadStudents();
              setShowLinkForm(false);
            }}
            onCancel={() => setShowLinkForm(false)}
          />
        </div>
      )}

      <section>
        <h2 className="font-display text-xl text-ink mb-4">Your students</h2>

        {studentsLoading ? (
          <PageLoading />
        ) : students.length === 0 ? (
          <Card>
            <EmptyState
              title="No students linked yet"
              description="Link a student by their account email to start sending education funds."
              action={
                <Button variant="secondary" size="sm" onClick={() => setShowLinkForm(true)}>
                  <UserPlus size={14} />
                  Link a student
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {students.map((s) => (
              <StudentRow
                key={s._id}
                student={s}
                expanded={selectedStudent === s._id}
                onToggle={() => setSelectedStudent(selectedStudent === s._id ? null : s._id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <TransactionHistory />
      </section>
    </DashboardShell>
  );
}

function StudentRow({
  student,
  expanded,
  onToggle,
}: {
  student: StudentSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="flex items-center justify-between !pb-5">
          <div>
            <p className="font-display text-lg text-ink">{student.name}</p>
            <p className="text-xs font-mono text-sand">{truncateWallet(student.walletPublicKey)}</p>
          </div>
          <span className="text-xs text-ledger font-medium">{expanded ? "Hide details" : "View & fund"}</span>
        </CardHeader>
      </button>
      {expanded && (
        <CardBody className="!pt-0 border-t border-hairline">
          <div className="pt-5">
            <StudentSpendingPanel student={student} />
          </div>
        </CardBody>
      )}
    </Card>
  );
}
