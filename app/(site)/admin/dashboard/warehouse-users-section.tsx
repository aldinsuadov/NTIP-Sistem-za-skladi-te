"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface WarehouseUser {
  id: number;
  email: string;
  role: string;
  mfaMethod: string;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  jmbg: string | null;
}

export function WarehouseUsersSection() {
  const [users, setUsers] = useState<WarehouseUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = (await res.json()) as { users?: WarehouseUser[]; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Ne mogu učitati korisnike.");
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card
      className={cn(
        "border bg-card shadow-md",
        "rounded-2xl transition-shadow hover:shadow-lg",
      )}
    >
      <CardHeader className="space-y-2 px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border/80">
            <Users className="size-5" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-xl font-bold">Korisnici s pristupom skladištu</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Odobreni nalozi koji se mogu prijaviti i koristiti aplikaciju (administratori i korisnici).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-8 sm:px-8">
        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="size-4 shrink-0" />
            <AlertTitle>Greška</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Učitavanje...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema odobrenih korisnika.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-muted/20 shadow-inner">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/60 text-left">
                  <th className="px-4 py-3 font-semibold">Ime i prezime</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Telefon</th>
                  <th className="px-4 py-3 font-semibold">JMBG</th>
                  <th className="px-4 py-3 font-semibold">Uloga</th>
                  <th className="px-4 py-3 font-semibold">MFA</th>
                  <th className="px-4 py-3 font-semibold">Registrovan</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs tracking-wide text-muted-foreground">
                      {u.jmbg ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.mfaMethod}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(new Date(u.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
