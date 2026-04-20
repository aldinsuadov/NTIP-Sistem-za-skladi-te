import { compare } from "bcryptjs";
import { MfaMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { isSmtpConfigured } from "@/lib/mfa-mailer";
import { prisma } from "@/lib/prisma";

interface Body {
  password?: string;
}

export async function POST(request: NextRequest) {
  const session = await getAuthFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { message: "Na serveru nije podešen SMTP (SMTP_HOST). Email MFA nije dostupan." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as Body;
  const password = body.password;
  if (!password) {
    return NextResponse.json({ message: "Lozinka je obavezna." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.sub) },
    select: { password: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 404 });
  }

  const ok = await compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ message: "Pogrešna lozinka." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: Number(session.sub) },
    data: {
      mfaMethod: MfaMethod.EMAIL,
      totpSecret: null,
      mfaEmailCodeHash: null,
      mfaEmailCodeExpiresAt: null,
    },
  });

  return NextResponse.json({
    message: "Email MFA je uključen. Kod za prijavu stiže na vaš email.",
  });
}
