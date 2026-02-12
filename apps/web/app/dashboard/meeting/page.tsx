'use client';

import { useState } from 'react';
import { apiUrl } from '../_lib/api';
import { SectionCard } from '../_components/ui';
import { ExportButtons } from '../_components/export-buttons';
import { RoleTag } from '../_components/role-tag';

export default function MeetingPage() {
  const [title, setTitle] = useState('Strategic AI Steering');
  const [transcript, setTranscript] = useState('Meeting focused on governance gates and workforce readiness.');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const response = await fetch(apiUrl('/api/meeting-upload'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-role': document.cookie.match(/sca_role=([^;]+)/i)?.[1] || 'Viewer',
      },
      body: JSON.stringify({ meetingTitle: title, transcript }),
    });
    if (response.ok) {
      setData(await response.json());
    }
    setLoading(false);
  };

  return (
    <SectionCard title="Meeting Intelligence Upload">
      {/* CHANGE: role + export actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RoleTag />
        <ExportButtons module="meeting" role={data?.permissions?.role} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50">Meeting Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <label className="block text-xs uppercase tracking-[0.2em] text-white/50">Transcript</label>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            className="h-40 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
          <div className="text-xs text-white/50">{transcript.length} characters</div>
          <button
            onClick={submit}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upload & Analyze'}
          </button>
        </div>
        <div className="space-y-3">
          {data ? (
            <div className="space-y-3 text-sm text-white/80">
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">{data.summary}</div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Action Items</p>
                <ul className="mt-2 space-y-2 text-xs text-white/70">
                  {data.action_items.map((item: any) => (
                    <li key={item.task} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      {item.owner}: {item.task} ({item.deadline})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Stakeholders</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
                  {data.stakeholders.map((s: string) => (
                    <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/50">Submit a transcript to generate structured meeting intelligence.</div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
