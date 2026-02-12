import { getJson } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { RoleTag } from '../_components/role-tag';

export default async function MetricsPage() {
  const data = await getJson('/api/metrics-summary');

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
