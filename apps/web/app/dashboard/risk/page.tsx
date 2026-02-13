'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default function RiskPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const run = async () => {
      const headers = {
        'Content-Type': 'application/json',
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      };
      try {
        const response = await fetchJson('/api/risk-flag', {
          method: 'POST',
          headers,
          body: JSON.stringify({ scope: 'enterprise-risk' }),
        });
        setData(response);
      } catch {
        // CHANGE: fallback data when API is unavailable
        setData({
          flags: [
            { id: 'RSK-08', label: 'SLA breach risk', urgency: 'critical', deadline: '2026-02-28', risk_score: 0.92, rationale: 'Predictive signal derived from backlog velocity and SLA thresholds.' },
            { id: 'RSK-11', label: 'Evidence backlog exceeds threshold', urgency: 'high', deadline: '2026-03-05', risk_score: 0.78, rationale: 'Predictive signal derived from backlog velocity and SLA thresholds.' },
          ],
          permissions: { role: 'Viewer' },
        });
      }
    };
    run();
  }, []);

  if (!data) {
    return <div className="text-sm text-white/70">Loading risk flags...</div>;
  }

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
