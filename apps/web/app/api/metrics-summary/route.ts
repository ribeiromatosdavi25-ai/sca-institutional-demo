import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: metrics summary mock for Vercel
export async function GET(req: NextRequest) {
  const role = roleFromRequest(req);

  return NextResponse.json({
    documents: 17,
    backlogScans: 6,
    backlogItemsFlagged: 42,
    riskFlags: 51,
    avgRiskScore: 0.71,
    lastExport: new Date().toISOString(),
    lastRun: new Date().toISOString(),
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
