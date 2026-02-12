'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '../_lib/api';

export function ExportButtons({ module, role }: { module: string; role?: string }) {
  const [status, setStatus] = useState('');
  const [currentRole, setCurrentRole] = useState(role || 'Viewer');

  useEffect(() => {
    if (!role) {
      const match = document.cookie.match(/sca_role=([^;]+)/i);
      setCurrentRole(match?.[1] || 'Viewer');
    }
  }, [role]);

  const canExport = currentRole === 'Admin';
  const tooltip = canExport ? 'Export data for compliance reporting' : 'Export available to Admin role only';

  const runExport = async (format: 'csv' | 'json') => {
    if (!canExport) {
      setStatus('restricted');
      return;
    }
    setStatus('exporting');
    const url = apiUrl(`/api/export-${format}?module=${module}`);
    const response = await fetch(url, {
      headers: {
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      },
    });
    if (response.ok) {
      setStatus('ready');
    } else {
      setStatus('failed');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60" title={tooltip}>
      <button
        onClick={() => runExport('csv')}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10 disabled:opacity-50"
        disabled={!canExport}
        aria-disabled={!canExport}
      >
        Export CSV
      </button>
      <button
        onClick={() => runExport('json')}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10 disabled:opacity-50"
        disabled={!canExport}
        aria-disabled={!canExport}
      >
        Export JSON
      </button>
      {status && <span className="uppercase tracking-[0.2em]">{status}</span>}
    </div>
  );
}
