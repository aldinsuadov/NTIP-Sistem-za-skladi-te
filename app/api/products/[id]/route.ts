import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ProductParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateProductBody {
  name?: string;
  price?: number | string;
  categoryId?: number;
  quantity?: number | string;
}

function parseProductId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function GET(_: Request, context: ProductParams) {
  try {
    const { id } = await context.params;
    const productId = parseProductId(id);

    if (!productId) {
      return NextResponse.json({ message: "Nevalidan ID proizvoda." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Proizvod nije pronadjen." }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
      },
    });
  } catch {
    return NextResponse.json({ message: "Neuspesno ucitavanje proizvoda." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: ProductParams) {
  try {
    const { id } = await context.params;
    const productId = parseProductId(id);

    if (!productId) {
      return NextResponse.json({ message: "Nevalidan ID proizvoda." }, { status: 400 });
    }

    const body = (await request.json()) as UpdateProductBody;

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: "Proizvod nije pronadjen." }, { status: 404 });
    }

    const updateData: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json({ message: "Naziv proizvoda ne sme biti prazan." }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    if (body.price !== undefined) {
      const numericPrice = Number(body.price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return NextResponse.json({ message: "price mora biti validan broj." }, { status: 400 });
      }
      updateData.price = new Prisma.Decimal(numericPrice);
    }

    if (body.categoryId !== undefined) {
      const categoryId = Number(body.categoryId);
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return NextResponse.json({ message: "categoryId mora biti validan broj." }, { status: 400 });
      }

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        return NextResponse.json({ message: "Kategorija nije pronadjena." }, { status: 404 });
      }

      updateData.category = {
        connect: { id: categoryId },
      };
    }

    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (!Number.isInteger(q) || q < 0) {
        return NextResponse.json(
          { message: "quantity mora biti cijeli broj veći ili jednak 0." },
          { status: 400 },
        );
      }
      updateData.quantity = q;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Nema podataka za azuriranje." }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      message: "Proizvod je uspesno azuriran.",
      product: {
        ...updatedProduct,
        price: Number(updatedProduct.price),
      },
    });
  } catch (error) {
    console.error("[PUT /api/products/[id]]", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2022") {
        return NextResponse.json(
          {
            message:
              "Baza nema kolonu za količinu. Primijenite migracije: npx prisma migrate deploy (ili prisma migrate dev u razvoju).",
          },
          { status: 503 },
        );
      }
    }

    const devDetail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? ` (${error.message})`
        : "";
    return NextResponse.json(
      { message: `Neuspesno azuriranje proizvoda.${devDetail}` },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: ProductParams) {
  try {
    const { id } = await context.params;
    const productId = parseProductId(id);

    if (!productId) {
      return NextResponse.json({ message: "Nevalidan ID proizvoda." }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ message: "Proizvod nije pronadjen." }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Proizvod je uspesno obrisan." });
  } catch {
    return NextResponse.json({ message: "Neuspesno brisanje proizvoda." }, { status: 500 });
  }
}
