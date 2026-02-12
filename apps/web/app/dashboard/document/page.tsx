'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default function DocumentPage() {
  const [data, setData] = useState<any>(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const response = await fetch(apiUrl('/api/analyze-document'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
        },
        body: JSON.stringify({
          title: 'AI Governance Operational Memo',
          text: 'Policy sign-off by 18 Mar 2026. Vendor DPIA by 22 Mar 2026. Stakeholders: Strategy Office, Data Office, Legal Compliance.',
          purpose: 'audit',
        }),
      });
      const payload = await response.json();
      setData(payload as any);
      setReviewed(false);
    };
    run();
  }, []);

  const confirmReview = async () => {
    if (!data?.analysis_id) return;
    if (!data?.permissions?.can_review) return;
    const response = await fetch(apiUrl('/api/confirm-review'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      },
      body: JSON.stringify({ analysis_id: data.analysis_id, reviewer: 'Oversight Board' }),
    });
    if (response.ok) {
      setReviewed(true);
    }
  };

  if (!data) {
    return (
      <SectionCard title="Document Analysis">
        Loading analysis...
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Document Analysis">
      {/* CHANGE: role + export actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RoleTag />
        <ExportButtons module="document" role={data.permissions?.role} />
      </div>
      {/* CHANGE: structured document output */}
      <div className="space-y-4 text-sm text-white/80">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          {data.summary}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Deadlines</p>
            <ul className="mt-2 space-y-2 text-xs text-white/70">
              {data.deadlines.map((item: any) => (
                <li key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  {item.label}: {item.date} ({item.urgency})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Stakeholders</p>
            <ul className="mt-2 space-y-2 text-xs text-white/70">
              {data.stakeholders.map((item: any) => (
                <li key={item.name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  {item.name} · {item.role}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Risks</p>
          <ul className="mt-2 space-y-2 text-xs text-white/70">
            {data.risks.map((item: any) => (
              <li key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {item.label} ({item.severity}) — {item.rationale}
              </li>
            ))}
          </ul>
        </div>
        {/* CHANGE: human review workflow */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          <span>Needs human review: {String(data.needs_human_review)}</span>
          <button
            onClick={confirmReview}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:bg-white/10"
            disabled={reviewed || !data.permissions?.can_review}
            title={data.permissions?.can_review ? 'Mark review complete' : 'Requires Analyst/Admin role'}
          >
            Mark as Reviewed
          </button>
          {reviewed && <span className="text-emerald-300">Reviewed</span>}
          {!data.permissions?.can_review && <span className="text-amber-300">Review requires Analyst/Admin</span>}
        </div>
      </div>
    </SectionCard>
  );
}
