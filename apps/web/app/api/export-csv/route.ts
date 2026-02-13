import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: export CSV mock for Vercel
export async function GET(req: NextRequest) {
  const role = roleFromRequest(req);
  const module = req.nextUrl.searchParams.get('module') || 'module';

  return NextResponse.json({
    format: 'csv',
    module,
    generated_at: new Date().toISOString(),
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
