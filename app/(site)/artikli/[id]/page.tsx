import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArtikalKolicinaEditor } from "@/components/artikli/artikal-kolicina-editor";
import { ObrisiArtikalButton } from "@/components/artikli/obrisi-artikal-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

interface ArtikalPageProps {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function generateMetadata({ params }: ArtikalPageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = parseId(id);
  if (!productId) return { title: "Artikal" };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });

  return {
    title: product?.name ?? "Artikal",
    description: product ? `Detalji artikla: ${product.name}` : "Detalji artikla",
  };
}

export default async function ArtikalDetailPage({ params }: ArtikalPageProps) {
  const { id } = await params;
  const productId = parseId(id);
  if (!productId) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  if (!product) notFound();

  const price = Number(product.price);

  return (
    <section className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <Link href="/artikli" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          ← Nazad na listu
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href="/artikli/novi" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Novi artikal
          </Link>
          <Link
            href={`/artikli?categoryId=${product.categoryId}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Ostali u kategoriji
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl leading-tight">{product.name}</CardTitle>
          <CardDescription>Interni ID: {product.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 pt-6 text-sm">
          <div className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground shrink-0">Kategorija</span>
            <Link
              href={`/artikli?categoryId=${product.categoryId}`}
              className="font-medium text-primary underline-offset-4 hover:underline sm:text-right"
            >
              {product.category.name}
            </Link>
          </div>
          <ArtikalKolicinaEditor productId={product.id} initialQuantity={product.quantity} />
          <div className="flex flex-col gap-1 border-b py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground shrink-0">Cijena</span>
            <span className="tabular-nums text-lg font-semibold sm:text-right">{formatPrice(price)}</span>
          </div>
          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="text-muted-foreground shrink-0">Dodato u evidenciju</span>
            <span className="sm:text-right">{formatDate(new Date(product.createdAt))}</span>
          </div>
          <div className="border-t pt-6">
            <ObrisiArtikalButton productId={product.id} productName={product.name} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
