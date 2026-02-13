import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: audit log mock for Vercel
export async function GET(req: NextRequest) {
  const role = roleFromRequest(req);
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 10);
  const items = Array.from({ length: limit }).map((_, idx) => ({
    id: `AUD-${(page - 1) * limit + idx + 1}`,
    user: idx % 2 === 0 ? 'Analyst.Team' : 'Ops.Manager',
    action: idx % 2 === 0 ? 'Backlog scan' : 'Risk flag review',
    time: new Date(Date.now() - idx * 3600000).toISOString(),
    status: idx % 3 === 0 ? 'Failed' : idx % 2 === 0 ? 'Completed' : 'Reviewed',
  }));

  return NextResponse.json({
    page,
    limit,
    total: 120,
    items,
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
