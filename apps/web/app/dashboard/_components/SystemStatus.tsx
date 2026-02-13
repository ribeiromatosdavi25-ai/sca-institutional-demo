'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '../_lib/api';

type StatusState = 'online' | 'offline';

export function SystemStatus() {
  const [status, setStatus] = useState<StatusState>('offline');

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const data = await fetchJson<{ status: StatusState }>('/api/system-status');
        if (active) {
          setStatus(data.status === 'online' ? 'online' : 'offline');
        }
      } catch {
        if (active) setStatus('offline');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const isOnline = status === 'online';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
      <span className={`relative flex h-2 w-2 items-center justify-center rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`}>
        {isOnline && (
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-400/60" />
        )}
      </span>
      SYSTEM — {isOnline ? 'ONLINE' : 'OFFLINE'}
    </div>
  );
}
