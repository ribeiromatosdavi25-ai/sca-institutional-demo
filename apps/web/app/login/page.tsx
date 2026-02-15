import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type LoginRole = 'employee' | 'it' | 'admin' | 'partner';
type DashboardRole = 'Viewer' | 'Analyst' | 'Admin';

const ROLE_LABEL: Record<LoginRole, string> = {
  employee: 'Employee Access',
  it: 'IT Operations',
  admin: 'Administrative Control',
  partner: 'External Partner',
};

const DASHBOARD_ROLE_BY_LOGIN_ROLE: Record<LoginRole, DashboardRole> = {
  employee: 'Viewer',
  it: 'Analyst',
  admin: 'Admin',
  partner: 'Viewer',
};

function normalizeRole(value: string | undefined): LoginRole {
  if (value === 'it' || value === 'admin' || value === 'partner') {
    return value;
  }
  return 'employee';
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { role?: string };
}) {
  const role = normalizeRole(searchParams?.role);

  async function authenticate(formData: FormData) {
    'use server';

    // Architecture note: cookie session is a placeholder for external SSO integration.
    const submittedRole = normalizeRole(formData.get('role')?.toString());
    const cookieStore = cookies();
    cookieStore.set('sca_session', 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
    });
    cookieStore.set('sca_access_role', submittedRole, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
    });
    cookieStore.set('sca_role', DASHBOARD_ROLE_BY_LOGIN_ROLE[submittedRole], {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
    });
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto flex min-h-screen w-[min(560px,92vw)] flex-col justify-center py-10 text-slate-100">
      <div className="rounded-[var(--radius-xl)] border border-[var(--glass-border)] bg-[var(--glass-surface)] p-6 shadow-[var(--shadow-elevated)]">
        <p className="text-xs uppercase tracking-[0.26em] text-white/50">Authentication Layer</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Institutional Sign-In</h1>
        <p className="mt-2 text-sm text-white/70">
          Selected route: <span className="font-medium text-white/90">{ROLE_LABEL[role]}</span>
        </p>

        <form action={authenticate} className="mt-6 grid gap-4">
          <input type="hidden" name="role" value={role} />
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            Placeholder authentication enabled. Continue to create a role-scoped session.
          </div>
          <button
            type="submit"
            className="rounded-[var(--radius-lg)] border border-emerald-300/35 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Continue as {ROLE_LABEL[role]}
          </button>
        </form>

        <Link href="/" className="mt-4 inline-block text-xs uppercase tracking-[0.16em] text-white/55 hover:text-white/80">
          Return to Access Gateway
        </Link>
      </div>
    </div>
  );
}
