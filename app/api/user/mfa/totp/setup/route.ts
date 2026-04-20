import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthOrEnrollmentForMfa } from "@/lib/auth";
import { createTotpSetup } from "@/lib/mfa-totp";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const gate = await getAuthOrEnrollmentForMfa(request);
  if (!gate) {
    return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(gate.session.sub) },
    select: { email: true, mfaMethod: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Korisnik nije pronađen." }, { status: 404 });
  }

  const { secret, otpauthUrl } = createTotpSetup(user.email);

  return NextResponse.json({
    secret,
    otpauthUrl,
    message: "Skenirajte QR ili unesite tajnu u aplikaciju, zatim potvrdite kodom.",
  });
}
