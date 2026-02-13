import { NextRequest, NextResponse } from 'next/server';
import { ethics, governance, permissionsFor, roleFromRequest } from '../_shared/common';

// CHANGE: meeting upload mock for Vercel
export async function POST(req: NextRequest) {
  const role = roleFromRequest(req);
  const input = await req.json().catch(() => ({}));

  return NextResponse.json({
    meeting_title: input?.meetingTitle || 'Operational Review',
    summary: 'Review focused on backlog reduction and SLA risk mitigation.',
    action_items: [
      { owner: 'Operations', task: 'Reduce backlog queue by 15%', deadline: '2026-03-08' },
      { owner: 'Compliance', task: 'Complete DPIA review', deadline: '2026-03-12' },
    ],
    stakeholders: ['Operations', 'Compliance', 'Strategy Office'],
    permissions: permissionsFor(role),
    governance,
    ethics,
  });
}
