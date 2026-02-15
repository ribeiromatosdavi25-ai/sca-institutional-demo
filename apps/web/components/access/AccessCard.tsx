import Link from 'next/link';

type AccessCardProps = {
  title: string;
  description: string;
  role: 'employee' | 'it' | 'admin' | 'partner';
  icon: string;
};

export function AccessCard({ title, description, role, icon }: AccessCardProps) {
  return (
    <Link
      href={`/login?role=${role}`}
      className="group block rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-5 shadow-[var(--shadow-soft)] transition hover:border-white/20 hover:bg-[var(--glass-surface-strong)] hover:shadow-[var(--shadow-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
        </div>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
          {icon}
        </span>
      </div>
      <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/50">
        <span>Access Route</span>
        <span className="transition group-hover:text-white/80">/login?role={role}</span>
      </div>
    </Link>
  );
}
