import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: confirm review mock for Vercel
export async function POST(req: NextRequest) {
  const role = roleFromRequest(req);
  const input = await req.json().catch(() => ({}));

  return NextResponse.json({
    review_id: input?.review_id || 'REV-001',
    reviewed_at: new Date().toISOString(),
    reviewed_by_role: role,
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
