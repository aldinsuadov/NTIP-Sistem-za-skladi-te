"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { CategoriesListResponse, ProductListSort, ProductsListResponse } from "@/types/api";

const PAGE_SIZE = 10;

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
);

const SORTS: ProductListSort[] = ["price_asc", "price_desc", "date_asc", "date_desc"];

function normalizeSort(raw: string | null): ProductListSort {
  if (raw && SORTS.includes(raw as ProductListSort)) return raw as ProductListSort;
  return "date_desc";
}

export function ArtikliClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const categoryIdParam = searchParams.get("categoryId") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const sortParam = normalizeSort(searchParams.get("sort"));

  const [categories, setCategories] = useState<CategoriesListResponse["data"]>([]);
  const [list, setList] = useState<ProductsListResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qDraft, setQDraft] = useState(qParam);
  const [minPriceDraft, setMinPriceDraft] = useState(minPriceParam);
  const [maxPriceDraft, setMaxPriceDraft] = useState(maxPriceParam);

  useEffect(() => {
    setQDraft(qParam);
  }, [qParam]);

  useEffect(() => {
    setMinPriceDraft(minPriceParam);
    setMaxPriceDraft(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = (await res.json()) as CategoriesListResponse & { message?: string };
        if (!res.ok) return;
        if (!cancelled) setCategories(data.data ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    params.set("sort", sortParam);
    if (categoryIdParam) params.set("categoryId", categoryIdParam);
    if (minPriceParam) params.set("minPrice", minPriceParam);
    if (maxPriceParam) params.set("maxPrice", maxPriceParam);
    if (qParam) params.set("q", qParam);

    try {
      const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as ProductsListResponse & { message?: string };
      if (!res.ok) {
        setLoadError(data.message ?? "Ne mogu da učitam artikle.");
        setList(null);
        return;
      }
      setList(data);
    } catch {
      setLoadError("Greška pri povezivanju sa serverom.");
      setList(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryIdParam, minPriceParam, maxPriceParam, qParam, sortParam]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const pushQuery = (next: URLSearchParams) => {
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  };

  const onCategoryChange = (value: string) => {
    const q = new URLSearchParams(searchParams.toString());
    q.set("page", "1");
    if (value) q.set("categoryId", value);
    else q.delete("categoryId");
    pushQuery(q);
  };

  const applySearch = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", "1");
    const term = qDraft.trim();
    if (term) next.set("q", term);
    else next.delete("q");
    pushQuery(next);
  };

  const applyPriceFilters = () => {
    const q = new URLSearchParams(searchParams.toString());
    q.set("page", "1");
    const min = minPriceDraft.trim();
    const max = maxPriceDraft.trim();
    if (min) q.set("minPrice", min);
    else q.delete("minPrice");
    if (max) q.set("maxPrice", max);
    else q.delete("maxPrice");
    pushQuery(q);
  };

  const togglePriceSort = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", "1");
    if (sortParam === "price_asc") next.set("sort", "price_desc");
    else if (sortParam === "price_desc") next.set("sort", "price_asc");
    else next.set("sort", "price_asc");
    pushQuery(next);
  };

  const toggleDateSort = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", "1");
    if (sortParam === "date_asc") next.set("sort", "date_desc");
    else if (sortParam === "date_desc") next.set("sort", "date_asc");
    else next.set("sort", "date_desc");
    pushQuery(next);
  };

  const goToPage = (p: number) => {
    const q = new URLSearchParams(searchParams.toString());
    q.set("page", String(p));
    pushQuery(q);
  };

  const totalPages = list?.pagination.totalPages ?? 1;
  const rows = list?.data ?? [];

  const priceSortActive = sortParam === "price_asc" || sortParam === "price_desc";
  const dateSortActive = sortParam === "date_asc" || sortParam === "date_desc";

  return (
    <section className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Artikli</h1>
          <p className="text-muted-foreground text-sm">
            Pregled artikala s pretragom po nazivu te filterom po kategoriji i cijeni.
          </p>
        </div>
        <Link href="/artikli/novi" className={buttonVariants({ variant: "default", size: "sm" })}>
          Novi artikal
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filteri</CardTitle>
          <CardDescription>Pretražite po nazivu i/ili odaberite kategoriju i raspon cijene.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full min-w-0 space-y-2">
            <Label htmlFor="search-q">Pretraga po nazivu</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative min-h-[2.75rem] min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="search-q"
                  type="search"
                  placeholder="npr. laptop, kafa, monitor…"
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                  className="h-11 w-full min-w-0 pl-9 text-base sm:text-sm"
                  autoComplete="off"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full shrink-0 px-6 sm:w-auto sm:min-w-[9rem]"
                onClick={() => applySearch()}
              >
                Pretraži
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/80 pt-6 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="grid w-full min-w-0 gap-2 lg:max-w-[14rem] lg:flex-1">
              <Label htmlFor="category">Kategorija</Label>
              <select
                id="category"
                className={selectClassName}
                value={categoryIdParam}
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                <option value="">Sve kategorije</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid w-full gap-2 sm:max-w-[11rem]">
              <Label htmlFor="minPrice">Min. cijena</Label>
              <Input
                id="minPrice"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                value={minPriceDraft}
                onChange={(e) => setMinPriceDraft(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="grid w-full gap-2 sm:max-w-[11rem]">
              <Label htmlFor="maxPrice">Max. cijena</Label>
              <Input
                id="maxPrice"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="—"
                value={maxPriceDraft}
                onChange={(e) => setMaxPriceDraft(e.target.value)}
                className="h-10"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-10 w-full sm:w-auto"
              onClick={() => void applyPriceFilters()}
            >
              Primijeni cijenu
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista artikala</CardTitle>
          <CardDescription>
            {list != null && (
              <>
                Ukupno: {list.pagination.total}{" "}
                {list.pagination.total === 1 ? "artikal" : "artikala"}
                {" · "}
                Sortiranje: klik na &quot;Cijena&quot; ili &quot;Dodato&quot; u zaglavlju tabele.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadError && (
            <p className="text-destructive text-sm" role="alert">
              {loadError}
            </p>
          )}

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Učitavanje...</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nema artikala za prikaz.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Naziv</th>
                    <th className="px-4 py-3 font-medium">Kategorija</th>
                    <th className="px-4 py-3 text-right font-medium tabular-nums">Količina</th>
                    <th className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={togglePriceSort}
                        className={cn(
                          "inline-flex w-full items-center justify-end gap-1.5 rounded-md px-1 py-0.5 text-left font-medium transition-colors",
                          "hover:bg-muted hover:text-foreground",
                          priceSortActive && "text-foreground",
                        )}
                      >
                        Cijena
                        {sortParam === "price_asc" ? (
                          <ArrowUp className="size-4 shrink-0" aria-hidden />
                        ) : sortParam === "price_desc" ? (
                          <ArrowDown className="size-4 shrink-0" aria-hidden />
                        ) : (
                          <ArrowUpDown className="size-4 shrink-0 opacity-40" aria-hidden />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={toggleDateSort}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 font-medium transition-colors",
                          "hover:bg-muted hover:text-foreground",
                          dateSortActive && "text-foreground",
                        )}
                      >
                        Dodato
                        {sortParam === "date_asc" ? (
                          <ArrowUp className="size-4 shrink-0" aria-hidden />
                        ) : sortParam === "date_desc" ? (
                          <ArrowDown className="size-4 shrink-0" aria-hidden />
                        ) : (
                          <ArrowUpDown className="size-4 shrink-0 opacity-40" aria-hidden />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t cursor-pointer transition-colors hover:bg-muted/40"
                      tabIndex={0}
                      onClick={() => router.push(`/artikli/${row.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/artikli/${row.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3">{row.category.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatPrice(row.price)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(new Date(row.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && rows.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-muted-foreground text-sm">
                Stranica {page} od {totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Prethodna
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Sljedeća
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
