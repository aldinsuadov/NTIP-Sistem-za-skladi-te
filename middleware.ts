import { NextResponse, type NextRequest } from "next/server";
import {
  getTokenFromRequest,
  mfaEnrollmentPendingCookie,
  verifyAuthToken,
  verifyMfaEnrollmentPendingToken,
} from "@/lib/auth";

function redirectToLogin(request: NextRequest, pathname: string) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);
  const fullPayload = token ? await verifyAuthToken(token) : null;

  const enrollRaw = request.cookies.get(mfaEnrollmentPendingCookie.name)?.value;
  const enrollPayload = enrollRaw ? await verifyMfaEnrollmentPendingToken(enrollRaw) : null;

  if (pathname === "/") {
    if (fullPayload) {
      const target =
        fullPayload.role === "ADMIN"
          ? new URL("/admin/dashboard", request.url)
          : new URL("/dashboard", request.url);
      return NextResponse.redirect(target);
    }
    if (enrollPayload) {
      return NextResponse.redirect(new URL("/profil/mfa?enroll=1", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/profil/mfa")) {
    if (fullPayload || enrollPayload) return NextResponse.next();
    return redirectToLogin(request, pathname);
  }

  if (pathname.startsWith("/api/user/mfa")) {
    if (fullPayload || enrollPayload) return NextResponse.next();
    return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
  }

  if (!fullPayload) {
    if (enrollPayload) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { message: "Potrebno je dovršiti postavljanje TOTP-a." },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/profil/mfa?enroll=1", request.url));
    }
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
    }
    return redirectToLogin(request, pathname);
  }

  if (pathname.startsWith("/dashboard")) {
    if (fullPayload.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (fullPayload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
