import { compare } from "bcryptjs";
import { MfaMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authCookie,
  mfaEnrollmentPendingCookie,
  mfaPendingCookie,
  signAuthToken,
  signMfaEnrollmentPendingToken,
  signMfaPendingToken,
} from "@/lib/auth";
import { maskEmail } from "@/lib/helpers";
import { generateSixDigitCode, hashEmailMfaCode } from "@/lib/mfa-email-code";
import { isSmtpConfigured, sendLoginMfaCode } from "@/lib/mfa-mailer";
import { prisma } from "@/lib/prisma";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ message: "Email i password su obavezni." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Pogresni kredencijali." }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Pogresni kredencijali." }, { status: 401 });
    }

    if (!user.approved) {
      return NextResponse.json(
        { message: "Nalog jos nije odobren od strane administratora." },
        { status: 403 },
      );
    }

    if (user.mfaMethod === MfaMethod.TOTP) {
      if (!user.totpSecret) {
        return NextResponse.json(
          { message: "TOTP MFA je ukljucen ali tajna nije sacuvana. Kontaktirajte administratora." },
          { status: 500 },
        );
      }

      const pending = await signMfaPendingToken(user.id, user.email);
      const response = NextResponse.json({
        message: "Potrebna je druga faktorska provjera.",
        mfaRequired: true,
        mfaMethod: "TOTP",
        emailMask: maskEmail(user.email),
      });
      response.cookies.set(mfaPendingCookie.name, pending, mfaPendingCookie.options);
      return response;
    }

    if (user.mfaMethod === MfaMethod.EMAIL) {
      if (!isSmtpConfigured()) {
        return NextResponse.json(
          { message: "Email MFA je ukljucen ali SMTP nije konfigurisan na serveru." },
          { status: 503 },
        );
      }

      const code = generateSixDigitCode();
      const codeHash = hashEmailMfaCode(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaEmailCodeHash: codeHash,
          mfaEmailCodeExpiresAt: expiresAt,
        },
      });

      try {
        await sendLoginMfaCode(user.email, code);
      } catch {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            mfaEmailCodeHash: null,
            mfaEmailCodeExpiresAt: null,
          },
        });
        return NextResponse.json(
          { message: "Slanje email koda nije uspjelo. Provjerite SMTP postavke." },
          { status: 500 },
        );
      }

      const pending = await signMfaPendingToken(user.id, user.email);
      const response = NextResponse.json({
        message: "Kod je poslan na email.",
        mfaRequired: true,
        mfaMethod: "EMAIL",
        emailMask: maskEmail(user.email),
      });
      response.cookies.set(mfaPendingCookie.name, pending, mfaPendingCookie.options);
      return response;
    }

    /** mfaMethod NONE — nema pune sesije dok se ne uključi TOTP na /profil/mfa */
    const enroll = await signMfaEnrollmentPendingToken(user.id, user.email, user.role);
    const response = NextResponse.json({
      message: "Potrebno je uključiti TOTP (aplikacija za autentifikaciju).",
      mfaRequired: true,
      enrollmentRequired: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mfaMethod: user.mfaMethod,
      },
    });
    response.cookies.set(mfaEnrollmentPendingCookie.name, enroll, mfaEnrollmentPendingCookie.options);
    return response;
  } catch {
    return NextResponse.json({ message: "Neuspesna prijava." }, { status: 500 });
  }
}
