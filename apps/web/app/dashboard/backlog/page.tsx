'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default function BacklogPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const run = async () => {
      const headers = {
        'Content-Type': 'application/json',
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      };
      try {
        const response = await fetchJson('/api/scan-backlog', {
          method: 'POST',
          headers,
          body: JSON.stringify({ source: 'institutional-backlog' }),
        });
        setData(response);
      } catch {
        // CHANGE: fallback data when API is unavailable
        setData({
          backlog_count: 42,
          high_priority: 7,
          medium_priority: 18,
          low_priority: 17,
          queue_health: 'healthy',
          items: [
            { id: 'BLG-120', title: 'Housing repair backlog', urgency: 'high', owner: 'Repairs Unit' },
            { id: 'BLG-121', title: 'FOI requests pending', urgency: 'medium', owner: 'Records Office' },
          ],
          permissions: { role: 'Viewer' },
        });
      }
    };
    run();
  }, []);

  if (!data) {
    return <div className="text-sm text-white/70">Loading backlog...</div>;
  }

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
