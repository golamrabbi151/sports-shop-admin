import { NextResponse, type NextRequest } from 'next/server';

/**
 * Every admin route requires a session cookie. This is a fast first gate only:
 * the API must authenticate and authorise (role/permission) every request.
 */
const COOKIE = process.env.ADMIN_COOKIE_NAME || 'kb_admin_session';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE)?.value);
  const isLogin = pathname === '/login';

  if (!hasSession && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = pathname === '/' ? '' : `?redirect=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (hasSession && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except static assets & metadata files.
  matcher: ['/((?!_next/static|_next/image|images|icon.svg|favicon.ico|robots.txt).*)'],
};
