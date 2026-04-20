import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [productsPerCategoryRaw, totalPriceAggregate, usersCount] = await Promise.all([
      prisma.product.groupBy({
        by: ["categoryId"],
        _count: {
          _all: true,
        },
        _sum: {
          price: true,
        },
      }),
      prisma.product.aggregate({
        _sum: {
          price: true,
        },
      }),
      prisma.user.count(),
    ]);

    const categoryIds = productsPerCategoryRaw.map((item) => item.categoryId);

    const categories = categoryIds.length
      ? await prisma.category.findMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const categoriesById = new Map(categories.map((category) => [category.id, category.name]));

    const productsPerCategory = productsPerCategoryRaw.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categoriesById.get(item.categoryId) ?? "Nepoznata kategorija",
      productsCount: item._count._all,
      totalPrice: Number(item._sum.price ?? 0),
    }));

    return NextResponse.json({
      productsPerCategory,
      totalProductsPrice: Number(totalPriceAggregate._sum.price ?? 0),
      usersCount,
    });
  } catch {
    return NextResponse.json({ message: "Neuspesno ucitavanje statistike." }, { status: 500 });
  }
}
