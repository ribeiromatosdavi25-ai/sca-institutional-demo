'use client';

import { useEffect, useState } from 'react';

export function RoleTag() {
  const [role, setRole] = useState('Viewer');

  useEffect(() => {
    const match = document.cookie.match(/sca_role=([^;]+)/i);
    setRole(match?.[1] || 'Viewer');
  }, []);

  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
      Role: {role}
    </span>
  );
}
