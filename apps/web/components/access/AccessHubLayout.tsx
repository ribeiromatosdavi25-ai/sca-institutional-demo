import { AccessCard } from './AccessCard';
import { SystemStatusChip } from '../ui/SystemStatusChip';

const ACCESS_ROLES = [
  {
    title: 'Employee Access',
    description: 'Operational access for institutional staff under governed policy controls.',
    role: 'employee' as const,
    icon: 'EMP',
  },
  {
    title: 'IT Operations',
    description: 'Infrastructure and runtime operations with observability and incident controls.',
    role: 'it' as const,
    icon: 'OPS',
  },
  {
    title: 'Administrative Control',
    description: 'Privileged governance access for access management and policy enforcement.',
    role: 'admin' as const,
    icon: 'ADM',
  },
  {
    title: 'External Partner',
    description: 'Restricted external integration entry with scoped permissions and audits.',
    role: 'partner' as const,
    icon: 'EXT',
  },
];

export function AccessHubLayout() {
  return (
    <section className="grid gap-5">
      <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/50">Role-Based Entry</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Institutional Access Hub</h2>
          </div>
          <SystemStatusChip label="RBAC Enforcement" tone="green" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {ACCESS_ROLES.map((accessRole) => (
            <AccessCard key={accessRole.role} {...accessRole} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-surface)] px-4 py-3 shadow-[var(--shadow-soft)]">
        <SystemStatusChip label="AI Governance Active" tone="green" />
        <SystemStatusChip label="Audit Logging Enabled" tone="blue" />
        <SystemStatusChip label="Human-in-the-loop Required" tone="yellow" />
        <SystemStatusChip label="Role-based Access Control" tone="blue" />
      </div>
    </section>
  );
}
