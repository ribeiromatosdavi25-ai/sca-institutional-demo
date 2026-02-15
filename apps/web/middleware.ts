import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ALLOWED_ACCESS_ROLES = new Set(['employee', 'it', 'admin', 'partner']);
const LEGACY_ACCESS_ROLE_BY_DASHBOARD_ROLE: Record<string, string> = {
  Viewer: 'employee',
  Analyst: 'it',
  Admin: 'admin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('sca_session')?.value === 'authenticated';
  const accessRole = request.cookies.get('sca_access_role')?.value;
  const dashboardRole = request.cookies.get('sca_role')?.value;

  // Architecture note: protect internal routes; gateway remains public.
  if (pathname.startsWith('/dashboard') && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/dashboard')) {
    if (accessRole && !ALLOWED_ACCESS_ROLES.has(accessRole)) {
      return NextResponse.redirect(new URL('/login?role=employee', request.url));
    }

    if (!accessRole && dashboardRole && LEGACY_ACCESS_ROLE_BY_DASHBOARD_ROLE[dashboardRole]) {
      const response = NextResponse.next();
      response.cookies.set('sca_access_role', LEGACY_ACCESS_ROLE_BY_DASHBOARD_ROLE[dashboardRole], {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8,
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
