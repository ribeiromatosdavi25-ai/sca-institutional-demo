import { getJson } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default async function RiskPage() {
  const data = await getJson<any>('/api/risk-flag', {
    method: 'POST',
    body: JSON.stringify({ scope: 'enterprise-risk' }),
  });

  return (
    <SectionCard title="Risk Flags & Timeline">
      {/* CHANGE: role + export actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RoleTag />
        <ExportButtons module="risk" role={data.permissions?.role} />
      </div>
      {/* CHANGE: risk timeline list */}
      <div className="space-y-3">
        {data.flags.map((flag: any) => (
          <div
            key={flag.id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              flag.risk_score >= 0.85
                ? 'border-red-400/40 bg-red-500/10'
                : flag.risk_score >= 0.7
                  ? 'border-amber-300/30 bg-amber-400/10'
                  : 'border-white/10 bg-white/5'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-white">{flag.label}</p>
              <p className="text-xs text-white/50">Deadline: {flag.deadline}</p>
              <p className="text-xs text-white/50">Score: {flag.risk_score} · {flag.rationale}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/70">{flag.urgency}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
