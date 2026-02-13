'use client';

import { useSystemHealth } from '../_lib/system-health';

export function SystemStatusBarChip() {
  const { state } = useSystemHealth();

  const className =
    state === 'online'
      ? 'rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-200'
      : state === 'degraded'
        ? 'rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-amber-200'
        : 'rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-red-200';

  const label = state === 'online' ? 'System > Online' : state === 'degraded' ? 'System > Degraded' : 'System > Offline';

  return <span className={className}>{label}</span>;
}
