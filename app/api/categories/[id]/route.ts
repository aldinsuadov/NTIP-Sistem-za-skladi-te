import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CategoryParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateCategoryBody {
  name?: string;
}

function parseCategoryId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function PUT(request: Request, context: CategoryParams) {
  try {
    const { id } = await context.params;
    const categoryId = parseCategoryId(id);

    if (!categoryId) {
      return NextResponse.json({ message: "Nevalidan ID kategorije." }, { status: 400 });
    }

    const body = (await request.json()) as UpdateCategoryBody;
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ message: "Naziv kategorije je obavezan." }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!existingCategory) {
      return NextResponse.json({ message: "Kategorija nije pronadjena." }, { status: 404 });
    }

    const duplicateByName = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id: categoryId },
      },
      select: { id: true },
    });

    if (duplicateByName) {
      return NextResponse.json({ message: "Kategorija sa tim nazivom vec postoji." }, { status: 409 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({
      message: "Kategorija je uspesno azurirana.",
      category: updatedCategory,
    });
  } catch {
    return NextResponse.json({ message: "Neuspesno azuriranje kategorije." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: CategoryParams) {
  try {
    const { id } = await context.params;
    const categoryId = parseCategoryId(id);

    if (!categoryId) {
      return NextResponse.json({ message: "Nevalidan ID kategorije." }, { status: 400 });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ message: "Kategorija nije pronadjena." }, { status: 404 });
    }

    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { message: "Kategorija ima vezane proizvode i ne moze biti obrisana." },
        { status: 409 },
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Kategorija je uspesno obrisana." });
  } catch {
    return NextResponse.json({ message: "Neuspesno brisanje kategorije." }, { status: 500 });
  }
}
