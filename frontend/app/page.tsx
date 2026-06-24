import Link from "next/link";
import { ArrowRight, Wallet, Receipt, GraduationCap, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <span className="font-display italic text-xl text-ink">EduRemit</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-soft hover:text-ink transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-ledger text-paper px-4 py-2 rounded hover:bg-ledger-dark transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — the thesis: a ledger of trust spanning distance */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-wider text-ledger font-medium mb-4">
            Education payments, kept in plain sight
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-ink leading-[1.08] mb-6">
            Every transfer, <em className="italic">stamped.</em>
            <br />
            Every expense, <em className="italic">seen.</em>
          </h1>
          <p className="text-ink-soft text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
            A parent sends funds from one country. A student spends and studies in another.
            EduRemit keeps the record between you — funding, spending, tuition — settled on
            the Stellar network and readable like a passbook, not a spreadsheet.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-ledger text-paper px-6 py-3 rounded font-medium hover:bg-ledger-dark transition-colors"
            >
              Open an account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-ink/20 text-ink px-6 py-3 rounded font-medium hover:border-ink/40 transition-colors"
            >
              I already have one
            </Link>
          </div>
        </div>
      </section>

      {/* The three roles — a real sequence (parent funds, student spends, university receives) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-hairline">
        <p className="text-xs uppercase tracking-wider text-sand font-medium mb-8">How the ledger moves</p>
        <div className="grid sm:grid-cols-3 gap-px bg-hairline rounded-md overflow-hidden">
          <RoleCard
            icon={<Wallet size={20} />}
            label="Parent"
            title="Sends funds"
            description="Connects a Stellar wallet and sends education funds to a linked student — settled on testnet in seconds."
          />
          <RoleCard
            icon={<Receipt size={20} />}
            label="Student"
            title="Tracks & pays"
            description="Logs spending by category, pays tuition directly to the university, and gets AI budgeting insights."
          />
          <RoleCard
            icon={<GraduationCap size={20} />}
            label="University"
            title="Receives & records"
            description="Sees every incoming payment in one registrar's log, with sender and settlement proof attached."
          />
        </div>
      </section>

      {/* Trust signal */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-hairline">
        <div className="flex items-start gap-4 max-w-2xl">
          <ShieldCheck size={22} className="text-ledger mt-1 flex-shrink-0" />
          <div>
            <p className="font-display text-xl text-ink mb-2">Built on Stellar testnet, in the open.</p>
            <p className="text-sand text-sm leading-relaxed">
              Every funding transfer and tuition payment is a real Stellar testnet transaction —
              not a simulated number in a database. You can verify any transfer's settlement
              independently on a public testnet explorer.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-xs text-sand">
          EduRemit AI — a testnet simulation built for educational demonstration purposes.
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  icon,
  label,
  title,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-paper p-6 flex flex-col gap-3">
      <div className="text-ledger">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-sand mb-1">{label}</p>
        <p className="font-display text-lg text-ink">{title}</p>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{description}</p>
    </div>
  );
}
