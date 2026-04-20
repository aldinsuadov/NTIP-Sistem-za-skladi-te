"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NovaKategorijaModal } from "@/components/artikli/nova-kategorija-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CategoriesListResponse } from "@/types/api";

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
);

export function NoviArtikalForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoriesListResponse["data"]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = (await res.json()) as CategoriesListResponse & { message?: string };
        if (!res.ok) {
          if (!cancelled) setCategoriesError(data.message ?? "Kategorije nisu učitane.");
          return;
        }
        if (!cancelled) {
          setCategories(data.data ?? []);
          setCategoriesError(null);
        }
      } catch {
        if (!cancelled) setCategoriesError("Greška pri učitavanju kategorija.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, "bs")),
    [categories],
  );

  const onCategoryCreated = (cat: { id: number; name: string }) => {
    setCategories((prev) => {
      const next = [...prev.filter((c) => c.id !== cat.id), { ...cat, _count: { products: 0 } }];
      return next;
    });
    setCategoryId(String(cat.id));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const cid = Number(categoryId);
    const priceNum = Number(price.replace(",", "."));

    if (!trimmedName) {
      setFormError("Naziv artikla je obavezan.");
      return;
    }
    if (!categoryId || Number.isNaN(cid) || cid <= 0) {
      setFormError("Odaberite kategoriju ili kreirajte novu.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError("Unesite ispravnu cijenu.");
      return;
    }

    const qtyTrim = quantity.trim();
    let quantityNum = 0;
    if (qtyTrim !== "") {
      quantityNum = Number(qtyTrim.replace(",", "."));
      if (!Number.isInteger(quantityNum) || quantityNum < 0) {
        setFormError("Količina mora biti cijeli broj ≥ 0.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          price: priceNum,
          categoryId: cid,
          quantity: quantityNum,
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        product?: { id: number };
      };

      if (!res.ok) {
        setFormError(data.message ?? "Artikal nije sačuvan.");
        return;
      }

      if (data.product?.id) {
        router.push(`/artikli/${data.product.id}`);
        router.refresh();
        return;
      }

      setFormError("Neočekivani odgovor servera.");
    } catch {
      setFormError("Greška pri povezivanju sa serverom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="container mx-auto max-w-lg px-4 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novi artikal</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Unesite podatke i dodijelite kategoriju.
            </p>
          </div>
          <Link href="/artikli" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            ← Lista artikala
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Podaci o artiklu</CardTitle>
            <CardDescription>Naziv, cijena i kategorija su obavezni. Količinu možete ostaviti prazno (0).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
              {categoriesError && (
                <Alert variant="destructive">
                  <AlertTitle>Učitavanje</AlertTitle>
                  <AlertDescription>{categoriesError}</AlertDescription>
                </Alert>
              )}

              {formError && (
                <Alert variant="destructive">
                  <AlertTitle>Greška</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="artikal-naziv">Naziv</Label>
                <Input
                  id="artikal-naziv"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Naziv artikla"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artikal-cijena">Cijena (KM)</Label>
                <Input
                  id="artikal-cijena"
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artikal-kolicina">Količina na skladištu</Label>
                <Input
                  id="artikal-kolicina"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                <p className="text-muted-foreground text-xs">Cijeli broj komada; prazno znači 0.</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <Label htmlFor="artikal-kategorija" className="mb-0">
                    Kategorija
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    Nova kategorija
                  </Button>
                </div>
                <select
                  id="artikal-kategorija"
                  className={selectClassName}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">
                    {sortedCategories.length === 0 ? "Nema kategorija — kreirajte novu" : "Odaberite kategoriju"}
                  </option>
                  {sortedCategories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Spremanje..." : "Sačuvaj artikal"}
                </Button>
                <Link href="/artikli" className={buttonVariants({ variant: "outline" })}>
                  Otkaži
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <NovaKategorijaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onCategoryCreated}
      />
    </>
  );
}
