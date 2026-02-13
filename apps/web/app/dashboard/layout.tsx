import type { ReactNode } from 'react';
import { Banner, GovernanceTags, FooterNote } from './_components/ui';
import { RoleSelector } from './_components/role-selector';
import { Breadcrumbs, NavLink } from './_components/nav';
import { SystemStatus } from './_components/SystemStatus';
import { SystemStatusBarChip } from './_components/SystemStatusBarChip';
import { AIServicesPanel } from './_components/ai-services-panel';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full text-slate-100 overflow-y-auto">
      {/* CHANGE: institutional shell */}
      <div className="mx-auto flex min-h-screen w-[min(1200px,92vw)] flex-col gap-6 py-6 md:py-8">
        <header className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] px-6 py-5 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Estado del sistema</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">SCA Institutional Operations</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* CHANGE: system status badge */}
              <SystemStatus />
              {/* CHANGE: AI services modal trigger */}
              <AIServicesPanel />
              <RoleSelector />
              <GovernanceTags />
            </div>
          </div>
        </header>

        {/* CHANGE: system status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          <div className="flex flex-wrap items-center gap-3">
            <SystemStatusBarChip />
            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sky-200">Ethics: Human-in-loop</span>
            <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-amber-200">Oversight: Required</span>
          </div>
          <Banner />
        </div>

        <Breadcrumbs />

        <nav className="flex flex-wrap gap-3">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/dashboard/backlog" label="Backlog" />
          <NavLink href="/dashboard/risk" label="Risk Flags" />
          <NavLink href="/dashboard/audit" label="Audit Log" />
          <NavLink href="/dashboard/document" label="Document Analysis" />
          <NavLink href="/dashboard/metrics" label="Metrics" />
          <NavLink href="/dashboard/meeting" label="Meeting Intelligence" />
        </nav>

        <main className="flex-1">{children}</main>

        <FooterNote />
      </div>
    </div>
  );
}
