'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default function AuditPage() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');

  const load = async (nextPage: number) => {
    const response = await fetch(apiUrl(`/api/audit-log?page=${nextPage}&limit=12`), {
      headers: {
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      },
    });
    const payload = await response.json();
    setData(payload);
    setPage(nextPage);
  };

  useEffect(() => {
    load(1);
  }, []);

  if (!data) {
    return (
      <SectionCard title="Audit Log Viewer">
        Loading audit log...
      </SectionCard>
    );
  }

  if (!data.permissions?.can_view_audit) {
    return (
      <SectionCard title="Audit Log Viewer">
        {/* CHANGE: role-based access */}
        <div className="text-sm text-white/60">Access restricted. Analyst or Admin required.</div>
      </SectionCard>
    );
  }

  const filtered = data.items.filter((item: any) => {
    if (user && !item.user.toLowerCase().includes(user.toLowerCase())) return false;
    if (action && !item.action.toLowerCase().includes(action.toLowerCase())) return false;
    return true;
  });

  return (
    <SectionCard title="Audit Log Viewer">
      {/* CHANGE: role + export actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RoleTag />
        <ExportButtons module="audit" role={data.permissions?.role} />
      </div>

      {/* CHANGE: filters */}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-white/60">
          User
          <input
            value={user}
            onChange={e => setUser(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            placeholder="Filter by user"
          />
        </label>
        <label className="text-xs text-white/60">
          Action
          <input
            value={action}
            onChange={e => setAction(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            placeholder="Filter by action"
          />
        </label>
        <label className="text-xs text-white/60">
          Date range
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            aria-label="Date range start"
          />
        </label>
      </div>

      {/* CHANGE: audit table */}
      <div className="overflow-hidden rounded-lg border border-white/10">
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
            {filtered.map((item: any) => (
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

      {/* CHANGE: pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-white/60">
        <button
          onClick={() => load(Math.max(1, page - 1))}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10"
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => load(page + 1)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10"
        >
          Next
        </button>
      </div>
    </SectionCard>
  );
}
