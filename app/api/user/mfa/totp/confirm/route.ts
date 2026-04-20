import { MfaMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authCookie,
  getAuthOrEnrollmentForMfa,
  mfaEnrollmentPendingCookie,
  signAuthToken,
} from "@/lib/auth";
import { verifyTotpCode } from "@/lib/mfa-totp";
import { prisma } from "@/lib/prisma";

interface Body {
  secret?: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  const gate = await getAuthOrEnrollmentForMfa(request);
  if (!gate) {
    return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const secret = body.secret?.trim();
  const code = body.code?.trim();

  if (!secret || !code) {
    return NextResponse.json({ message: "Tajna i kod su obavezni." }, { status: 400 });
  }

  if (!verifyTotpCode(secret, code)) {
    return NextResponse.json({ message: "Kod nije ispravan." }, { status: 400 });
  }

  const userId = Number(gate.session.sub);
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaMethod: MfaMethod.TOTP,
      totpSecret: secret,
      mfaEmailCodeHash: null,
      mfaEmailCodeExpiresAt: null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 404 });
  }

  const token = await signAuthToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  });

  const response = NextResponse.json({
    message: "TOTP je uključen. Sljedeća prijava zahtijeva kod iz aplikacije.",
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaMethod: MfaMethod.TOTP,
    },
  });

  response.cookies.set(authCookie.name, token, authCookie.options);
  response.cookies.delete(mfaEnrollmentPendingCookie.name);

  return response;
}
