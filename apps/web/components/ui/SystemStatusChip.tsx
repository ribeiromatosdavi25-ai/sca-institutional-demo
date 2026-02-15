type SystemStatusTone = 'green' | 'yellow' | 'red' | 'blue';

const toneClasses: Record<SystemStatusTone, string> = {
  green: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200',
  yellow: 'border-amber-300/30 bg-amber-500/10 text-amber-200',
  red: 'border-rose-300/30 bg-rose-500/10 text-rose-200',
  blue: 'border-sky-300/30 bg-sky-500/10 text-sky-200',
};

export function SystemStatusChip({
  label,
  tone = 'blue',
}: {
  label: string;
  tone?: SystemStatusTone;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
