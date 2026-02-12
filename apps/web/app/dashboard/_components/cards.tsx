import { ComplianceNote } from './ui';

export function BacklogCard({ data }: { data: { backlog_count: number; high_priority: number; medium_priority: number; low_priority: number; queue_health: string } }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Backlog Status</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">{data.queue_health}</span>
      </div>
      <div className="mt-3">
        <ComplianceNote />
      </div>
      <div className="mt-4 text-4xl font-semibold text-white">{data.backlog_count}</div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-white/60">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">High {data.high_priority}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Medium {data.medium_priority}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Low {data.low_priority}</div>
      </div>
    </div>
  );
}

export function RiskPanel({ data }: { data: { flags: { id: string; label: string; urgency: string; deadline: string; risk_score: number; rationale?: string }[] } }) {
  const legend = [
    { label: 'Critical', className: 'bg-red-500/20 text-red-200 border-red-400/40' },
    { label: 'High', className: 'bg-amber-400/20 text-amber-200 border-amber-300/40' },
    { label: 'Medium', className: 'bg-sky-400/20 text-sky-200 border-sky-300/40' },
    { label: 'Low', className: 'bg-slate-400/20 text-slate-200 border-slate-300/40' },
  ];

  const badgeClass = (urgency: string) => {
    if (urgency === 'critical') return 'bg-red-500/20 text-red-200 border-red-400/40';
    if (urgency === 'high') return 'bg-amber-400/20 text-amber-200 border-amber-300/40';
    if (urgency === 'medium') return 'bg-sky-400/20 text-sky-200 border-sky-300/40';
    return 'bg-slate-400/20 text-slate-200 border-slate-300/40';
  };

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Risk Flags</p>
        <div className="flex flex-wrap gap-2">
          {legend.map(item => (
            <span key={item.label} className={`rounded-full border px-2 py-0.5 text-[10px] ${item.className}`}>{item.label}</span>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <ComplianceNote />
      </div>
      <div className="mt-4 space-y-3">
        {data.flags.map(flag => (
          <div key={flag.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{flag.label}</p>
                <p className="text-xs text-white/50">Deadline: {flag.deadline}</p>
                <p className="text-xs text-white/50">{flag.rationale || 'Predictive signal from backlog velocity and SLA thresholds.'}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] ${badgeClass(flag.urgency)}`}>{flag.urgency}</span>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-emerald-400/70"
                  style={{ width: `${Math.min(100, Math.max(8, Math.round(flag.risk_score * 100)))}%` }}
                  aria-label={`Risk score ${flag.risk_score}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditLogTable({ data }: { data: { items: { id: string; user: string; action: string; time: string; status: string }[] } }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Audit Log</p>
      <div className="mt-3">
        <ComplianceNote />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-xs text-white/70">
          <thead className="bg-white/5 text-[11px] uppercase tracking-[0.2em] text-white/50">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(item => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-3 py-2 text-white">{item.user}</td>
                <td className="px-3 py-2">{item.action}</td>
                <td className="px-3 py-2">{new Date(item.time).toLocaleString()}</td>
                <td className="px-3 py-2">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DocumentSummaryCard({ data }: { data: { summary: string; deadlines: { label: string; date: string; urgency: string }[]; stakeholders: { name: string; role: string }[]; risks: { label: string; severity: string; rationale: string }[] } }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Document Summary</p>
      <div className="mt-3">
        <ComplianceNote />
      </div>
      <p className="mt-4 text-sm text-white/80">{data.summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Deadlines</p>
          <ul className="mt-2 space-y-2 text-xs text-white/70">
            {data.deadlines.map(item => (
              <li key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {item.label}: {item.date} ({item.urgency})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Stakeholders</p>
          <ul className="mt-2 space-y-2 text-xs text-white/70">
            {data.stakeholders.map(item => (
              <li key={item.name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {item.name} · {item.role}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Risks</p>
        <ul className="mt-2 space-y-2 text-xs text-white/70">
          {data.risks.map(item => (
            <li key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              {item.label} ({item.severity}) — {item.rationale}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
