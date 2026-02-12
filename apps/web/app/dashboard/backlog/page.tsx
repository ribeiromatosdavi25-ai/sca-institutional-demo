export const dynamic = 'force-dynamic';

import { getJson } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default async function BacklogPage() {
  const data = await getJson<any>('/api/scan-backlog', {
    method: 'POST',
    body: JSON.stringify({ source: 'institutional-backlog' }),
  });

  return (
    <SectionCard title="Backlog Monitor">
      {/* CHANGE: role + export actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RoleTag />
        <ExportButtons module="backlog" role={data.permissions?.role} />
      </div>
      {/* CHANGE: structured backlog panel */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Total: {data.backlog_count}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">High: {data.high_priority}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Medium: {data.medium_priority}</div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">Low: {data.low_priority}</div>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-xs text-white/70">
          <thead className="bg-white/5 text-[11px] uppercase tracking-[0.2em] text-white/50">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Urgency</th>
              <th className="px-3 py-2">Owner</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-3 py-2 text-white">{item.id}</td>
                <td className="px-3 py-2">{item.title}</td>
                <td className="px-3 py-2">{item.urgency}</td>
                <td className="px-3 py-2">{item.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
