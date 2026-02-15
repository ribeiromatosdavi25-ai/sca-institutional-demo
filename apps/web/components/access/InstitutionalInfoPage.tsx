import Link from 'next/link';

export function InstitutionalInfoPage({
  section,
  title,
  description,
}: {
  section: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-[min(920px,92vw)] flex-col justify-center gap-5 py-8 text-slate-100">
      <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs uppercase tracking-[0.24em] text-white/50">{section}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">{description}</p>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Controlled institutional content placeholder. Integrate policy documents, control matrices, and governance records here.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
          >
            Access Gateway
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
