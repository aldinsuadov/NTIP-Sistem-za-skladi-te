import "dotenv/config";
import { hash } from "bcryptjs";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Lokalni admin; promijeni preko .env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD */
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@skladiste.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "AdminSkladiste2026!";

const CATEGORY_NAMES = [
  "Elektronika",
  "Namještaj",
  "Alati",
  "Hrana i piće",
] as const;

type ProductSeed = {
  name: string;
  price: string;
  category: (typeof CATEGORY_NAMES)[number];
};

const PRODUCTS: ProductSeed[] = [
  { name: "Laptop Pro 15", price: "1899.99", category: "Elektronika" },
  { name: "Miš bežični", price: "29.90", category: "Elektronika" },
  { name: "Monitor 27\"", price: "419.00", category: "Elektronika" },
  { name: "Stolica uredska", price: "249.00", category: "Namještaj" },
  { name: "Radni sto 140cm", price: "329.99", category: "Namještaj" },
  { name: "Bušilica akumulatorska", price: "179.00", category: "Alati" },
  { name: "Set odvijača", price: "45.50", category: "Alati" },
  { name: "Voda 1.5L (paket 6)", price: "8.40", category: "Hrana i piće" },
  { name: "Kafa 500g", price: "12.90", category: "Hrana i piće" },
];

async function main() {
  const passwordHash = await hash(ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: UserRole.ADMIN,
      approved: true,
    },
    update: {
      role: UserRole.ADMIN,
      approved: true,
      password: passwordHash,
    },
  });

  const categoryByName = new Map<string, { id: number; name: string }>();

  for (const name of CATEGORY_NAMES) {
    const row = await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    categoryByName.set(name, row);
  }

  let productsCreated = 0;
  let productsSkipped = 0;

  for (const p of PRODUCTS) {
    const cat = categoryByName.get(p.category);
    if (!cat) {
      console.warn(`Preskačem artikal "${p.name}" — nepoznata kategorija "${p.category}".`);
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: {
        name: p.name,
        categoryId: cat.id,
      },
    });

    if (existing) {
      productsSkipped += 1;
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        price: new Prisma.Decimal(p.price),
        categoryId: cat.id,
      },
    });
    productsCreated += 1;
  }

  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();

  console.log("");
  console.log("Seed završen.");
  console.log("  Admin email:    ", ADMIN_EMAIL);
  console.log("  Admin lozinka:  ", ADMIN_PASSWORD);
  console.log("  Kategorija (seed imena):", CATEGORY_NAMES.length, "| u bazi:", categoryCount);
  console.log("  Artikli dodati sada:   ", productsCreated, "| već postojali:", productsSkipped, "| ukupno u bazi:", productCount);
  console.log("");
  console.log("Aplikacija: http://localhost:3000  |  Prijava: /login  |  Admin: /admin");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
