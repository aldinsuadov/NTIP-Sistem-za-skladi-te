import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { GET as listProducts, POST as createProduct } from "@/app/api/products/route";
import {
  DELETE as deleteProduct,
  GET as getProduct,
  PUT as updateProduct,
} from "@/app/api/products/[id]/route";
import { prismaMock } from "@/tests/helpers/prisma-mock";

const sampleProduct = {
  id: 1,
  name: "Artikal A",
  price: new Prisma.Decimal("19.99"),
  quantity: 5,
  categoryId: 10,
  createdAt: new Date("2026-01-01"),
  category: { id: 10, name: "Kat" },
};

describe("Product API (mock prisma)", () => {
  it("GET /api/products vraća listu i paginaciju", async () => {
    prismaMock.product.count.mockResolvedValue(1);
    prismaMock.product.findMany.mockResolvedValue([sampleProduct] as never);

    const req = new Request("http://localhost/api/products?page=1&limit=10");
    const res = await listProducts(req);

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      pagination: { total: number; page: number };
      data: { name: string; price: number }[];
    };
    expect(json.pagination.total).toBe(1);
    expect(json.pagination.page).toBe(1);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe("Artikal A");
    expect(json.data[0].price).toBe(19.99);
  });

  it("GET /api/products odbija nevalidan categoryId", async () => {
    const req = new Request("http://localhost/api/products?categoryId=abc");
    const res = await listProducts(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/products vraća 400 bez obaveznih polja", async () => {
    const req = new Request("http://localhost/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    const res = await createProduct(req);
    expect(res.status).toBe(400);
    expect(prismaMock.product.create).not.toHaveBeenCalled();
  });

  it("POST /api/products vraća 404 ako kategorija ne postoji", async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Novi", price: 5, categoryId: 99 }),
    });
    const res = await createProduct(req);
    expect(res.status).toBe(404);
  });

  it("POST /api/products kreira proizvod", async () => {
    prismaMock.category.findUnique.mockResolvedValue({ id: 10 } as never);
    prismaMock.product.create.mockResolvedValue(sampleProduct as never);

    const req = new Request("http://localhost/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Novi", price: 19.99, categoryId: 10 }),
    });
    const res = await createProduct(req);

    expect(res.status).toBe(201);
    const json = (await res.json()) as { product: { name: string; price: number } };
    expect(json.product.name).toBe("Artikal A");
    expect(json.product.price).toBe(19.99);
  });

  it("GET /api/products/[id] vraća 400 za nevalidan id", async () => {
    const res = await getProduct(
      new Request("http://localhost/api/products/abc"),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(res.status).toBe(400);
  });

  it("GET /api/products/[id] vraća 404", async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    const res = await getProduct(
      new Request("http://localhost/api/products/999"),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(res.status).toBe(404);
  });

  it("GET /api/products/[id] vraća proizvod", async () => {
    prismaMock.product.findUnique.mockResolvedValue(sampleProduct as never);

    const res = await getProduct(
      new Request("http://localhost/api/products/1"),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { product: { name: string } };
    expect(json.product.name).toBe("Artikal A");
  });

  it("PUT /api/products/[id] vraća 400 za prazan naziv", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 1 } as never);

    const req = new Request("http://localhost/api/products/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });
    const res = await updateProduct(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });

  it("PUT /api/products/[id] ažurira proizvod", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1 } as never);
    const updated = {
      ...sampleProduct,
      name: "Renamed",
      price: new Prisma.Decimal("9"),
    };
    prismaMock.product.update.mockResolvedValue(updated as never);

    const req = new Request("http://localhost/api/products/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Renamed", price: 9 }),
    });
    const res = await updateProduct(req, { params: Promise.resolve({ id: "1" }) });

    expect(res.status).toBe(200);
    const json = (await res.json()) as { product: { name: string; price: number } };
    expect(json.product.name).toBe("Renamed");
    expect(json.product.price).toBe(9);
  });

  it("DELETE /api/products/[id] briše proizvod", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 1 } as never);
    prismaMock.product.delete.mockResolvedValue(sampleProduct as never);

    const res = await deleteProduct(
      new Request("http://localhost/api/products/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(res.status).toBe(200);
    expect(prismaMock.product.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
