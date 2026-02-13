import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: backlog mock for Vercel
export async function POST(req: NextRequest) {
  const role = roleFromRequest(req);
  return NextResponse.json({
    backlog_count: 42,
    high_priority: 7,
    medium_priority: 18,
    low_priority: 17,
    queue_health: 'healthy',
    items: [
      { id: 'BK-0142', title: 'Housing benefit review', urgency: 'high', owner: 'Casework' },
      { id: 'BK-0134', title: 'Adult social care triage', urgency: 'high', owner: 'ASC' },
      { id: 'BK-0119', title: 'Waste services KPI audit', urgency: 'medium', owner: 'Operations' },
    ],
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
