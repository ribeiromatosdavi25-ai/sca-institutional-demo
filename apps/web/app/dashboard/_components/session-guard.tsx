const ACCESS_ROLE_LABEL: Record<string, string> = {
  employee: 'Employee Access',
  it: 'IT Operations',
  admin: 'Administrative Control',
  partner: 'External Partner',
};

export function SessionGuard({
  accessRole,
  dashboardRole,
}: {
  accessRole?: string;
  dashboardRole?: string;
}) {
  const knownAccessRole = accessRole && ACCESS_ROLE_LABEL[accessRole];

  if (!knownAccessRole) {
    return (
      <div className="rounded-md border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
        Session guard active: legacy session detected. Access scope defaults to governed baseline.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">Session Scope</span>
      <span className="rounded-full border border-sky-300/30 bg-sky-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-sky-100">
        {knownAccessRole}
      </span>
      {dashboardRole ? (
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/80">
          Runtime Role: {dashboardRole}
        </span>
      ) : null}
    </div>
  );
}
