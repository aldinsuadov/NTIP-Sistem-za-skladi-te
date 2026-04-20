"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, IdCard, Lock, Mail, Phone, UserPlus, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RegisterResponse {
  message?: string;
}

const inputIconClass =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jmbg, setJmbg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          jmbg,
          email,
          password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        setError(data.message ?? "Registracija nije uspela.");
        return;
      }

      router.replace("/?cekanjeOdobrenja=1");
    } catch {
      setError("Došlo je do greške pri povezivanju sa serverom.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container mx-auto flex min-h-[100dvh] flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <Card
        className={cn(
          "w-full max-w-xl border bg-card/95 shadow-lg backdrop-blur-sm",
          "rounded-2xl py-6 transition-shadow hover:shadow-xl",
        )}
      >
        <CardHeader className="space-y-3 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                "bg-primary/10 text-primary ring-1 ring-primary/15",
              )}
            >
              <UserPlus className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Registracija</CardTitle>
              <CardDescription className="text-muted-foreground">
                Unesite svoje podatke. Administrator ih vidi prije odobrenja naloga.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 sm:px-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ime</Label>
                <div className="relative">
                  <Users className={inputIconClass} aria-hidden />
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Ime"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    minLength={2}
                    disabled={isLoading}
                    className="h-10 pl-9 transition-[box-shadow] focus-visible:ring-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prezime</Label>
                <div className="relative">
                  <Users className={inputIconClass} aria-hidden />
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Prezime"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                    minLength={2}
                    disabled={isLoading}
                    className="h-10 pl-9 transition-[box-shadow] focus-visible:ring-2"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Broj telefona</Label>
              <div className="relative">
                <Phone className={inputIconClass} aria-hidden />
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+387 61 000 000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10 pl-9 transition-[box-shadow] focus-visible:ring-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jmbg">JMBG</Label>
              <div className="relative">
                <IdCard className={inputIconClass} aria-hidden />
                <Input
                  id="jmbg"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="13 cifara"
                  value={jmbg}
                  onChange={(event) => setJmbg(event.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10 pl-9 font-mono text-sm tracking-wide transition-[box-shadow] focus-visible:ring-2"
                />
              </div>
              <p className="text-xs text-muted-foreground">Jedinstveni matični broj (13 cifara).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className={inputIconClass} aria-hidden />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ime@domen.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10 pl-9 transition-[box-shadow] focus-visible:ring-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <div className="relative">
                <Lock className={inputIconClass} aria-hidden />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 6 karaktera"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  disabled={isLoading}
                  className="h-10 pl-9 transition-[box-shadow] focus-visible:ring-2"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="size-4 shrink-0" />
                <AlertTitle>Greška</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-10 w-full transition-transform hover:scale-[1.01] active:scale-[0.99] hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Registracija u toku..." : "Registruj se"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Već imate nalog?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Prijavite se
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
