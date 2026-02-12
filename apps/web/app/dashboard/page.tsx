'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from './_lib/api';
import { AuditLogTable, BacklogCard, DocumentSummaryCard, RiskPanel } from './_components/cards';

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const run = async () => {
      const headers = {
        'Content-Type': 'application/json',
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      };
      const [backlog, risk, audit, doc, metrics] = await Promise.all([
        fetch(apiUrl('/api/scan-backlog'), { method: 'POST', headers, body: JSON.stringify({ source: 'institutional-demo' }) }).then(r => r.json()),
        fetch(apiUrl('/api/risk-flag'), { method: 'POST', headers, body: JSON.stringify({ scope: 'council-operations' }) }).then(r => r.json()),
        fetch(apiUrl('/api/audit-log?page=1&limit=6'), { headers }).then(r => r.json()),
        fetch(apiUrl('/api/analyze-document'), { method: 'POST', headers, body: JSON.stringify({ title: 'AI Strategy Brief', text: 'Policy sign-off by 18 Mar 2026. Vendor review on 4 Apr 2026. Stakeholders include Strategy Office and Legal Compliance.', purpose: 'policy' }) }).then(r => r.json()),
        fetch(apiUrl('/api/metrics-summary'), { headers }).then(r => r.json()),
      ]);
      setData({ backlog, risk, audit, doc, metrics });
    };
    run();
  }, []);

  if (!data) {
    return <div className="text-sm text-white/70">Loading dashboard...</div>;
  }

  const { backlog, risk, audit, doc, metrics } = data;

  return (
    <div className="grid gap-6">
      {/* CHANGE: KPI overview strip */}
      <section className="grid gap-4 md:grid-cols-4">
        <div title="Total documents analyzed" className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Documents</p>
          <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
            {metrics.documents}
            <span aria-label="trend up" className="text-emerald-300">▲</span>
          </div>
        </div>
        <div title="Risk flags generated" className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Risk Flags</p>
          <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
            {metrics.riskFlags}
            <span aria-label="trend up" className="text-amber-300">▲</span>
          </div>
        </div>
        <div title="Average Risk Score — indicates predictive severity level" className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Avg. Risk Score</p>
          <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
            {metrics.avgRiskScore}
            <span aria-label="trend down" className="text-sky-200">▼</span>
          </div>
        </div>
        <div title="Last pipeline run" className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Last Run</p>
          <div className="mt-2 text-sm text-white/80">{metrics.lastRun || 'n/a'}</div>
        </div>
      </section>

      {/* CHANGE: primary operational tiles */}
      <div className="grid gap-6 md:grid-cols-2">
        <BacklogCard data={backlog} />
        <RiskPanel data={risk} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <AuditLogTable data={audit} />
        <DocumentSummaryCard data={doc} />
      </div>
    </div>
  );
}
