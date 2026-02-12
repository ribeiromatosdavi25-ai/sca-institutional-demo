import type { ReactNode } from 'react';

export function Banner() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-surface)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
      Operating within AI Strategic Framework
    </div>
  );
}

export function ComplianceNote() {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60">
      AI outputs require human validation; human-in-loop enforced.
    </div>
  );
}

export function GovernanceTags() {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Audit Logging Enabled</span>
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Role-based Access: Viewer / Analyst / Admin</span>
    </div>
  );
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-3">
        <ComplianceNote />
      </div>
      <div className="mt-4 text-sm text-white/70">{children}</div>
    </section>
  );
}

export function FooterNote() {
  return (
    <footer className="mt-10 text-center text-xs text-white/40">
      Governed by Powering Our Futures Programme; Ethics & Transparency enforced
    </footer>
  );
}
