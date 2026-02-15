import { SystemStatusChip } from '../ui/SystemStatusChip';

export function InstitutionalHeader() {
  return (
    <header className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] px-6 py-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 grid h-11 w-11 place-items-center rounded-md border border-white/15 bg-white/10 text-xs font-semibold tracking-[0.18em] text-white/80">
            SCA
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Institutional Access Gateway</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">SCA Institutional Platform</h1>
            <p className="mt-2 text-sm text-white/65">Secure AI Operations Infrastructure</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SystemStatusChip label="System Online" tone="green" />
          <SystemStatusChip label="Audit Enabled" tone="blue" />
          <SystemStatusChip label="Human Oversight" tone="yellow" />
        </div>
      </div>
    </header>
  );
}
