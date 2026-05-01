import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["es"],
  defaultLocale: "es",
  localePrefix: "never",
});

// Using a partial auth config for middleware to avoid edge runtime issues with Prisma
const { auth } = NextAuth({
  providers: [],
});

export default auth((req) => {
  const { nextUrl } = req;
  const isDev = process.env.NODE_ENV === "development";
  const isLoggedIn = !!req.auth || isDev;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return intlMiddleware(req as unknown as NextRequest);
  }

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect to dashboard from root if logged in, else to login
  if (nextUrl.pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    } else {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  if (!nextUrl.pathname.startsWith("/api")) {
    return intlMiddleware(req as unknown as NextRequest);
  }

  return NextResponse.next();
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
