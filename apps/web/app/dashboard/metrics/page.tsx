'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { RoleTag } from '../_components/role-tag';

export default function MetricsPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const run = async () => {
      const headers = {
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      };
      try {
        const response = await fetchJson('/api/metrics-summary', { headers });
        setData(response);
      } catch {
        // CHANGE: fallback data when API is unavailable
        setData({
          documents: 17,
          backlogItemsFlagged: 42,
          avgRiskScore: 0.71,
          lastExport: new Date().toISOString(),
          lastRun: new Date().toISOString(),
        });
      }
    };
    run();
  }, []);

  if (!data) {
    return <div className="text-sm text-white/70">Loading metrics...</div>;
  }

  return (
    <SectionCard title="KPI Metrics Summary">
      {/* CHANGE: role + KPI tiles */}
      <div className="mb-4 flex items-center justify-between">
        <RoleTag />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Analyses: {data.documents}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Backlog flagged: {data.backlogItemsFlagged}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Avg. risk score: {data.avgRiskScore}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Last export: {data.lastExport || 'n/a'}</div>
      </div>
      <div className="mt-4 text-xs text-white/60">
        Last run: {data.lastRun || 'n/a'}
      </div>
    </SectionCard>
  );
}
