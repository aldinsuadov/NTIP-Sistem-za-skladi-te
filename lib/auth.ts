import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import type { JwtPayload } from "@/types/auth";

const AUTH_COOKIE_NAME = "auth_token";
const MFA_PENDING_COOKIE_NAME = "mfa_pending";
const MFA_ENROLLMENT_PENDING_COOKIE_NAME = "mfa_enrollment_pending";
const encoder = new TextEncoder();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return encoder.encode(secret);
}

/** Puna sesija samo nakon MFA koraka ili završenog TOTP setupa. */
export async function signAuthToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    mfa_done: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (payload.mfa_step === true) {
      return null;
    }

    if (payload.mfa_enroll_only === true) {
      return null;
    }

    if (payload.mfa_done !== true) {
      return null;
    }

    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      sub: payload.sub,
      email: String(payload.email),
      role: payload.role as JwtPayload["role"],
    };
  } catch {
    return null;
  }
}

export async function signMfaPendingToken(userId: number, email: string): Promise<string> {
  return new SignJWT({
    email,
    mfa_step: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getJwtSecret());
}

export async function verifyMfaPendingToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.mfa_step !== true || !payload.sub || !payload.email) {
      return null;
    }
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }
    return { userId, email: String(payload.email) };
  } catch {
    return null;
  }
}

/** Ograničena sesija: samo stranica /profil/mfa i API za uključivanje TOTP pri prvoj prijavi (mfaMethod NONE). */
export async function signMfaEnrollmentPendingToken(
  userId: number,
  email: string,
  role: UserRole,
): Promise<string> {
  return new SignJWT({
    email,
    role,
    mfa_enroll_only: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getJwtSecret());
}

export async function verifyMfaEnrollmentPendingToken(
  token: string,
): Promise<{ sub: string; email: string; role: UserRole } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.mfa_enroll_only !== true || !payload.sub || !payload.email || !payload.role) {
      return null;
    }
    const sub = String(payload.sub);
    const userId = Number(sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }
    return {
      sub,
      email: String(payload.email),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (fromCookie) return fromCookie;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7);
}

export const authCookie = {
  name: AUTH_COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export const mfaPendingCookie = {
  name: MFA_PENDING_COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  },
};

export const mfaEnrollmentPendingCookie = {
  name: MFA_ENROLLMENT_PENDING_COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  },
};

export async function getAuthFromRequest(request: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function getEnrollmentFromRequest(
  request: NextRequest,
): Promise<{ sub: string; email: string; role: UserRole } | null> {
  const raw = request.cookies.get(MFA_ENROLLMENT_PENDING_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyMfaEnrollmentPendingToken(raw);
}

/** Za /api/user/mfa/* — puna sesija ili sesija samo za prvi TOTP setup. */
export async function getAuthOrEnrollmentForMfa(
  request: NextRequest,
): Promise<
  | { kind: "full"; session: JwtPayload }
  | { kind: "enrollment"; session: { sub: string; email: string; role: UserRole } }
  | null
> {
  const full = await getAuthFromRequest(request);
  if (full) return { kind: "full", session: full };
  const en = await getEnrollmentFromRequest(request);
  if (en) return { kind: "enrollment", session: en };
  return null;
}
