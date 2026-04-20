"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/helpers";
import type { StatsResponse } from "@/types/api";

/** Različite nijanse za pie/bar — dobar kontrast u svijetlom i tamnom okruženju */
const CHART_COLORS = [
  "oklch(0.55 0.19 250)",
  "oklch(0.58 0.17 155)",
  "oklch(0.72 0.16 75)",
  "oklch(0.56 0.2 295)",
  "oklch(0.58 0.19 25)",
  "oklch(0.55 0.16 220)",
  "oklch(0.65 0.18 55)",
  "oklch(0.52 0.14 200)",
];

export function StatistikaClient() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = (await res.json()) as StatsResponse & { message?: string };
        if (!res.ok) {
          if (!cancelled) {
            setError(data.message ?? "Statistika nije učitana.");
            setStats(null);
          }
          return;
        }
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Greška pri povezivanju sa serverom.");
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = useMemo(() => {
    if (!stats?.productsPerCategory.length) return [];
    return stats.productsPerCategory.map((row) => ({
      name: row.categoryName,
      value: row.productsCount,
    }));
  }, [stats]);

  const barData = useMemo(() => {
    if (!stats?.productsPerCategory.length) return [];
    return stats.productsPerCategory.map((row) => ({
      naziv: row.categoryName,
      ukupno: row.totalPrice,
    }));
  }, [stats]);

  const hasProducts = (stats?.productsPerCategory.length ?? 0) > 0;

  return (
    <section className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Statistika</h1>
        <p className="text-muted-foreground text-sm">
          Pregled artikala po kategorijama i ukupnih vrijednosti.
        </p>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Učitavanje...</p>}

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {!loading && stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ukupna vrijednost artikala</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatPrice(stats.totalProductsPrice)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Broj korisnika</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{stats.usersCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Kategorija sa artiklima</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {stats.productsPerCategory.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {!loading && stats && !hasProducts && (
        <p className="text-muted-foreground text-sm">Nema artikala za prikaz grafikona.</p>
      )}

      {!loading && stats && hasProducts && (
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="min-h-[380px]">
            <CardHeader>
              <CardTitle className="text-base">Broj artikala po kategoriji</CardTitle>
              <CardDescription>Udio artikala u ukupnom inventaru.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="oklch(0.99 0 0 / 0.35)"
                    strokeWidth={1}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        className="dark:brightness-110 dark:saturate-125"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const v = item?.value;
                      const n = typeof v === "number" ? v : Number(v);
                      return (
                        <div
                          className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm shadow-sm"
                          style={{ outline: "none" }}
                        >
                          <p className="font-medium text-foreground">{item?.name}</p>
                          <p className="text-muted-foreground">{Number.isFinite(n) ? n : 0} kom</p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="min-h-[380px]">
            <CardHeader>
              <CardTitle className="text-base">Ukupna vrijednost po kategoriji</CardTitle>
              <CardDescription>Suma cijena svih artikala u kategoriji (KM).</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={barData}
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" horizontal />
                  <XAxis
                    type="number"
                    dataKey="ukupno"
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("bs-BA", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(Number(v))
                    }
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="naziv"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const raw = payload[0]?.value;
                      const n = typeof raw === "number" ? raw : Number(raw);
                      return (
                        <div
                          className="rounded-lg border border-border bg-card px-2.5 py-2 text-sm shadow-sm"
                          style={{ outline: "none" }}
                        >
                          <p className="font-medium text-foreground">{String(label ?? "")}</p>
                          <p className="tabular-nums text-muted-foreground">
                            {formatPrice(Number.isFinite(n) ? n : 0)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="ukupno" name="Vrijednost" radius={[0, 4, 4, 0]} maxBarSize={36}>
                    {barData.map((_, i) => (
                      <Cell
                        key={`bar-${i}`}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        className="dark:brightness-110 dark:saturate-125"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
