import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ApproveUserBody {
  userId?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApproveUserBody;
    const userId = body.userId;

    if (!userId || Number.isNaN(Number(userId))) {
      return NextResponse.json({ message: "userId je obavezan." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, approved: true },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "Korisnik nije pronadjen." }, { status: 404 });
    }

    if (existingUser.approved) {
      return NextResponse.json({ message: "Korisnik je vec odobren." }, { status: 200 });
    }

    const approvedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { approved: true },
      select: {
        id: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Korisnik je uspesno odobren.",
      user: approvedUser,
    });
  } catch {
    return NextResponse.json({ message: "Neuspesno odobravanje korisnika." }, { status: 500 });
  }
}
