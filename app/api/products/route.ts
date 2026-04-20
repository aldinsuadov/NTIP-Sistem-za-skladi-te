import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ProductBody {
  name?: string;
  price?: number | string;
  categoryId?: number;
  quantity?: number | string;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProductBody;
    const name = body.name?.trim();
    const categoryId = Number(body.categoryId);
    const price = body.price;

    if (!name || Number.isNaN(categoryId) || categoryId <= 0 || price === undefined) {
      return NextResponse.json(
        { message: "name, price i categoryId su obavezni." },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ message: "Kategorija nije pronadjena." }, { status: 404 });
    }

    let quantity = 0;
    if (body.quantity !== undefined && body.quantity !== null && body.quantity !== "") {
      const q = Number(body.quantity);
      if (!Number.isInteger(q) || q < 0) {
        return NextResponse.json(
          { message: "quantity mora biti cijeli broj veći ili jednak 0." },
          { status: 400 },
        );
      }
      quantity = q;
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: new Prisma.Decimal(price),
        categoryId,
        quantity,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Proizvod uspesno kreiran.",
        product: {
          ...product,
          price: Number(product.price),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ message: "Neuspesno kreiranje proizvoda." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const categoryIdRaw = url.searchParams.get("categoryId");
    const minPriceRaw = url.searchParams.get("minPrice");
    const maxPriceRaw = url.searchParams.get("maxPrice");
    const qRaw = url.searchParams.get("q")?.trim() ?? "";
    const sortRaw = url.searchParams.get("sort")?.trim() ?? "";
    const page = parsePositiveInt(url.searchParams.get("page"), 1);
    const limit = parsePositiveInt(url.searchParams.get("limit"), 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (qRaw) {
      if (qRaw.length > 200) {
        return NextResponse.json({ message: "Pretraga može imati najviše 200 karaktera." }, { status: 400 });
      }
      where.name = { contains: qRaw, mode: "insensitive" };
    }

    if (categoryIdRaw) {
      const categoryId = Number(categoryIdRaw);
      if (Number.isNaN(categoryId) || categoryId <= 0) {
        return NextResponse.json({ message: "categoryId mora biti validan broj." }, { status: 400 });
      }
      where.categoryId = categoryId;
    }

    if (minPriceRaw || maxPriceRaw) {
      where.price = {};

      if (minPriceRaw) {
        const minPrice = Number(minPriceRaw);
        if (Number.isNaN(minPrice) || minPrice < 0) {
          return NextResponse.json({ message: "minPrice mora biti validan broj." }, { status: 400 });
        }
        where.price.gte = new Prisma.Decimal(minPrice);
      }

      if (maxPriceRaw) {
        const maxPrice = Number(maxPriceRaw);
        if (Number.isNaN(maxPrice) || maxPrice < 0) {
          return NextResponse.json({ message: "maxPrice mora biti validan broj." }, { status: 400 });
        }
        where.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    const SORT_VALUES = ["price_asc", "price_desc", "date_asc", "date_desc"] as const;
    type SortKey = (typeof SORT_VALUES)[number];

    let sort: SortKey;
    if (!sortRaw) {
      sort = "date_desc";
    } else if (SORT_VALUES.includes(sortRaw as SortKey)) {
      sort = sortRaw as SortKey;
    } else {
      return NextResponse.json(
        { message: "sort mora biti: price_asc, price_desc, date_asc ili date_desc." },
        { status: 400 },
      );
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : sort === "date_asc"
            ? { createdAt: "asc" }
            : { createdAt: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return NextResponse.json({
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      filters: {
        q: qRaw || null,
        categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
        minPrice: minPriceRaw ? Number(minPriceRaw) : null,
        maxPrice: maxPriceRaw ? Number(maxPriceRaw) : null,
        sort,
      },
      data: products.map((product) => ({
        ...product,
        price: Number(product.price),
      })),
    });
  } catch {
    return NextResponse.json({ message: "Neuspesno ucitavanje proizvoda." }, { status: 500 });
  }
}
