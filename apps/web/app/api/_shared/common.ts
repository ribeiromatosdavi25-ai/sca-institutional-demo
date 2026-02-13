import { NextRequest } from 'next/server';

export type DemoRole = 'Viewer' | 'Analyst' | 'Admin';

export const governance = {
  audit_logged: true,
  data_boundary: 'm365-simulated',
  retention: 'no_document_storage',
  roles: ['Viewer', 'Analyst', 'Admin'],
};

export const ethics = {
  human_in_loop: true,
  explainability: true,
};

export const permissionsFor = (role: DemoRole) => ({
  role,
  can_review: role !== 'Viewer',
  can_export: role === 'Admin',
  can_view_audit: role !== 'Viewer',
});

export const roleFromRequest = (req: NextRequest): DemoRole => {
  const headerRole = (req.headers.get('x-demo-role') || '').toLowerCase();
  if (headerRole === 'admin') return 'Admin';
  if (headerRole === 'analyst') return 'Analyst';
  return 'Viewer';
};
