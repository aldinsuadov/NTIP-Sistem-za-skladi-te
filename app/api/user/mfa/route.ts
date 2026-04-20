import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthOrEnrollmentForMfa } from "@/lib/auth";
import { isSmtpConfigured } from "@/lib/mfa-mailer";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const gate = await getAuthOrEnrollmentForMfa(request);
  if (!gate) {
    return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
  }

  const userId = Number(gate.session.sub);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaMethod: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 404 });
  }

  return NextResponse.json({
    mfaMethod: user.mfaMethod,
    smtpConfigured: isSmtpConfigured(),
  });
}
