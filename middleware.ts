import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, isSafeRedirectPath, verifySessionToken } from "@/lib/auth";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const isLoggedIn = await verifySessionToken(token);

      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isLoggedIn = await verifySessionToken(token);

  if (isLoggedIn) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const requestedPath = `${pathname}${request.nextUrl.search}`;

  if (isSafeRedirectPath(requestedPath) && requestedPath !== "/") {
    loginUrl.searchParams.set("next", requestedPath);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
