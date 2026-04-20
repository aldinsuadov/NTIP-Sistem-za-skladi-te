import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { approved: false },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        phone: true,
        jmbg: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ message: "Neuspesno ucitavanje korisnika." }, { status: 500 });
  }
}
