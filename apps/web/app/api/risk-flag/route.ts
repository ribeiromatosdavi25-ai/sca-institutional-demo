import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: risk mock for Vercel
export async function POST(req: NextRequest) {
  const role = roleFromRequest(req);
  const flags = [
    { id: 'RSK-08', label: 'SLA breach risk', urgency: 'critical', deadline: '2026-02-28', risk_score: 0.92, rationale: 'Predictive signal derived from backlog velocity and SLA thresholds.' },
    { id: 'RSK-11', label: 'Evidence backlog exceeds threshold', urgency: 'high', deadline: '2026-03-05', risk_score: 0.78, rationale: 'Predictive signal derived from backlog velocity and SLA thresholds.' },
    { id: 'RSK-14', label: 'Vendor DPIA pending', urgency: 'medium', deadline: '2026-03-22', risk_score: 0.55, rationale: 'Predictive signal derived from backlog velocity and SLA thresholds.' },
  ];

  return NextResponse.json({
    generated_for: 'portfolio',
    flags,
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
