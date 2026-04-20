"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, UserCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface PendingUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  jmbg: string | null;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/admin/pending-users", { cache: "no-store" });
      const data = (await response.json()) as { users?: PendingUser[]; message?: string };

      if (!response.ok) {
        setError(data.message ?? "Ne mogu da ucitam listu korisnika.");
        return;
      }

      setUsers(data.users ?? []);
    } catch {
      setError("Došlo je do greške pri povezivanju sa serverom.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const approve = async (userId: number) => {
    setError(null);
    setApprovingId(userId);
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Odobravanje nije uspelo.");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError("Došlo je do greške pri povezivanju sa serverom.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <section className="container mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <Card
        className={cn(
          "border bg-card shadow-lg",
          "rounded-2xl transition-shadow hover:shadow-xl",
        )}
      >
        <CardHeader className="space-y-2 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20">
              <UserCheck className="size-5" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-2xl font-bold">Korisnici na čekanju</CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                Korisnici koji još nisu odobreni. Odobravanjem im se omogućava prijava.
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

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Učitavanje...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nema korisnika koji čekaju odobrenje.</p>
          ) : (
            <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-muted/20 shadow-inner">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-2 text-sm">
                    <p className="text-base font-semibold leading-snug text-foreground">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                    </p>
                    <p className="truncate font-medium text-muted-foreground">{user.email}</p>
                    <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-[auto_1fr] sm:gap-x-3">
                      <dt className="font-medium text-foreground/80">Telefon</dt>
                      <dd>{user.phone ?? "—"}</dd>
                      <dt className="font-medium text-foreground/80">JMBG</dt>
                      <dd className="font-mono tracking-wide">{user.jmbg ?? "—"}</dd>
                      <dt className="font-medium text-foreground/80">Uloga</dt>
                      <dd>{user.role}</dd>
                      <dt className="font-medium text-foreground/80">Registrovan</dt>
                      <dd>{formatDate(new Date(user.createdAt))}</dd>
                    </dl>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={approvingId === user.id}
                    onClick={() => void approve(user.id)}
                    className="w-full shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98] hover:bg-primary/90 sm:w-auto"
                  >
                    {approvingId === user.id ? "Odobravanje..." : "Odobri"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
