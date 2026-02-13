'use client';

import { useSystemHealth } from '../_lib/system-health';

export function SystemStatus() {
  const { state } = useSystemHealth();
  const isOnline = state === 'online';
  const isDegraded = state === 'degraded';

  const dotClass = isOnline ? 'bg-emerald-400' : isDegraded ? 'bg-amber-300' : 'bg-red-400';
  const label = isOnline ? 'ONLINE' : isDegraded ? 'DEGRADED' : 'OFFLINE';
  const pingClass = isOnline
    ? 'bg-emerald-400/60'
    : isDegraded
      ? 'bg-amber-300/60'
      : 'bg-red-400/60';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
      <span className={`relative flex h-2 w-2 items-center justify-center rounded-full ${dotClass}`}>
        {(isOnline || isDegraded) && (
          <span className={`absolute inline-flex h-3 w-3 animate-ping rounded-full ${pingClass}`} />
        )}
      </span>
      SYSTEM - {label}
    </div>
  );
}
