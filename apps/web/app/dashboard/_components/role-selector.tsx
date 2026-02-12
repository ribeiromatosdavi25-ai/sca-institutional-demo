'use client';

import { useEffect, useState } from 'react';

const roles = ['Viewer', 'Analyst', 'Admin'] as const;

export function RoleSelector() {
  const [role, setRole] = useState<string>('Viewer');

  useEffect(() => {
    const match = document.cookie.match(/sca_role=([^;]+)/i);
    setRole(match?.[1] || 'Viewer');
  }, []);

  const handleChange = (value: string) => {
    document.cookie = `sca_role=${value}; path=/`;
    setRole(value);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2 text-xs text-white/70">
      <span className="uppercase tracking-[0.2em] text-white/50">Role</span>
      <select
        value={role}
        onChange={e => handleChange(e.target.value)}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80"
      >
        {roles.map(r => (
          <option key={r} value={r} className="bg-slate-900">
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
