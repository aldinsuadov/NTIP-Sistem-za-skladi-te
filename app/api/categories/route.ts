import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CategoryBody {
  name?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CategoryBody;
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ message: "Naziv kategorije je obavezan." }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingCategory) {
      return NextResponse.json({ message: "Kategorija vec postoji." }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: { name },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Kategorija je uspesno kreirana.",
        category,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ message: "Neuspesno kreiranje kategorije." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: categories });
  } catch {
    return NextResponse.json({ message: "Neuspesno ucitavanje kategorija." }, { status: 500 });
  }
}
