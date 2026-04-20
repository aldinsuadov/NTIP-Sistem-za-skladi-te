import { MfaMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authCookie,
  mfaPendingCookie,
  signAuthToken,
  verifyMfaPendingToken,
} from "@/lib/auth";
import { verifyEmailMfaCode } from "@/lib/mfa-email-code";
import { verifyTotpCode } from "@/lib/mfa-totp";
import { prisma } from "@/lib/prisma";

interface Body {
  code?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const raw = body.code?.trim() ?? "";
    if (!raw) {
      return NextResponse.json({ message: "Kod je obavezan." }, { status: 400 });
    }

    const mfaCookie = request.cookies.get(mfaPendingCookie.name)?.value;
    if (!mfaCookie) {
      return NextResponse.json({ message: "Sesija za MFA je istekla. Prijavite se ponovo." }, { status: 401 });
    }

    const pending = await verifyMfaPendingToken(mfaCookie);
    if (!pending) {
      return NextResponse.json({ message: "Sesija za MFA je nevažeća." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: pending.userId },
    });

    if (!user || !user.approved) {
      return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 401 });
    }

    if (user.email !== pending.email) {
      return NextResponse.json({ message: "Neusklađena sesija." }, { status: 401 });
    }

    let mfaOk = false;

    if (user.mfaMethod === MfaMethod.TOTP) {
      if (!user.totpSecret) {
        return NextResponse.json({ message: "TOTP nije podešen." }, { status: 400 });
      }
      mfaOk = verifyTotpCode(user.totpSecret, raw);
    } else if (user.mfaMethod === MfaMethod.EMAIL) {
      if (!user.mfaEmailCodeExpiresAt || user.mfaEmailCodeExpiresAt < new Date()) {
        return NextResponse.json({ message: "Kod je istekao. Prijavite se ponovo." }, { status: 401 });
      }
      mfaOk = verifyEmailMfaCode(raw, user.mfaEmailCodeHash);
      if (mfaOk) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            mfaEmailCodeHash: null,
            mfaEmailCodeExpiresAt: null,
          },
        });
      }
    } else {
      return NextResponse.json({ message: "MFA nije uključen." }, { status: 400 });
    }

    if (!mfaOk) {
      return NextResponse.json({ message: "Neispravan kod." }, { status: 401 });
    }

    const token = await signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      message: "Uspješna prijava.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mfaMethod: user.mfaMethod,
      },
    });

    response.cookies.set(authCookie.name, token, authCookie.options);
    response.cookies.delete(mfaPendingCookie.name);

    return response;
  } catch {
    return NextResponse.json({ message: "Neuspješna verifikacija." }, { status: 500 });
  }
}
