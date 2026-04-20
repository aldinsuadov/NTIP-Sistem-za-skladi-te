import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Odobreni korisnici s pristupom skladištu (ADMIN i USER). */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { approved: true },
      select: {
        id: true,
        email: true,
        role: true,
        mfaMethod: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        phone: true,
        jmbg: true,
      },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ message: "Neuspješno učitavanje korisnika." }, { status: 500 });
  }
}
