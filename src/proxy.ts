import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed the middleware.ts convention to proxy.ts (function
// name `proxy`) — see node_modules/next/dist/docs/.../file-conventions/proxy.md.
//
// This is an OPTIMISTIC check only: it just looks at whether the session
// cookie is present, never touches the database (proxy runs on every
// request, including prefetches, so a DB round trip here would be a real
// perf cost). It exists purely to bounce obviously-logged-out visitors
// away from /app and obviously-logged-in visitors away from /login before
// a page even renders. The actual authorization — is this session still
// valid, is this user allowed at this school — happens in the DAL
// (lib/auth/dal.ts) on every protected page/action, which is the real
// security boundary.
const SESSION_COOKIE = "elimupro_session";
const PROTECTED_PREFIX = "/app";
const AUTH_PAGES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith(PROTECTED_PREFIX) && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PAGES.includes(pathname) && hasSessionCookie) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
