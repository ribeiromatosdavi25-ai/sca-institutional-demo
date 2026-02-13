import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: analyze document mock for Vercel
export async function POST(req: NextRequest) {
  const role = roleFromRequest(req);
  const input = await req.json().catch(() => ({}));

  return NextResponse.json({
    generated_for: input?.title || 'document',
    summary: 'Strategy brief indicates pending approvals with legal and procurement oversight.',
    deadlines: [
      { label: 'Policy sign-off', date: '2026-03-18', urgency: 'high' },
      { label: 'Vendor review', date: '2026-04-04', urgency: 'medium' },
    ],
    stakeholders: [
      { name: 'Strategy Office', role: 'Owner' },
      { name: 'Legal Compliance', role: 'Reviewer' },
    ],
    risks: [
      { label: 'SLA deviation', severity: 'medium', rationale: 'Backlog velocity trending above threshold.' },
    ],
    needs_human_review: true,
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
