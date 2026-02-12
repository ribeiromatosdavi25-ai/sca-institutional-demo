'use client';

import { usePathname } from 'next/navigation';

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  return (
    <a
      href={href}
      className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 ${
        active ? 'border-white/20 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </a>
  );
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean).slice(1);
  const crumbs = ['dashboard', ...parts];
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-white/50">
      {crumbs.map((c, idx) => (
        <span key={c} className="flex items-center gap-2">
          <span className={idx === crumbs.length - 1 ? 'text-white/70' : ''}>{c}</span>
          {idx < crumbs.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}
