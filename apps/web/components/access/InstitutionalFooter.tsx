import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/security-policy', label: 'Security Policy' },
  { href: '/governance', label: 'Governance' },
  { href: '/compliance', label: 'Compliance' },
  { href: '/documentation', label: 'Documentation' },
  { href: '/system-information', label: 'System Information' },
];

export function InstitutionalFooter() {
  return (
    <footer className="rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-surface)] px-5 py-4 shadow-[var(--shadow-soft)]">
      <nav className="flex flex-wrap gap-3 text-xs text-white/60">
        {FOOTER_LINKS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 transition hover:border-white/20 hover:text-white/85"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
