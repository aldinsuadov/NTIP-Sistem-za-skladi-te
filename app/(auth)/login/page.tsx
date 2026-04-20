"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, Shield, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LoginResponse {
  message?: string;
  mfaRequired?: boolean;
  enrollmentRequired?: boolean;
  mfaMethod?: "TOTP" | "EMAIL";
  emailMask?: string;
  user?: {
    role?: "ADMIN" | "USER";
    mfaMethod?: "NONE" | "TOTP" | "EMAIL";
  };
}

function getPostLoginTarget(data: LoginResponse, redirectTo: string): string {
  if (data.user?.role === "ADMIN") {
    return "/admin/dashboard";
  }
  if (data.user?.role === "USER") {
    const wantsSpecific =
      redirectTo &&
      redirectTo !== "/" &&
      redirectTo.startsWith("/") &&
      !redirectTo.startsWith("//") &&
      !redirectTo.startsWith("/admin");
    if (wantsSpecific) return redirectTo;
    return "/dashboard";
  }
  return redirectTo || "/";
}

const inputIconClass =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground";

export default function LoginPage() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"TOTP" | "EMAIL" | null>(null);
  const [emailMask, setEmailMask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin")) {
      setRedirectTo(next);
    }
  }, []);

  const cancelMfa = async () => {
    setError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    setMfaMethod(null);
    setEmailMask(null);
    setMfaCode("");
  };

  const onSubmitCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.message ?? "Prijava nije uspjela.");
        return;
      }

      if (data.enrollmentRequired) {
        setSuccess(data.message ?? "Preusmjeravanje na postavljanje TOTP-a…");
        setTimeout(() => {
          router.push("/profil/mfa?enroll=1");
          router.refresh();
        }, 400);
        return;
      }

      if (data.mfaRequired && data.mfaMethod) {
        setMfaMethod(data.mfaMethod);
        setEmailMask(data.emailMask ?? null);
        setMfaCode("");
        setSuccess(
          data.mfaMethod === "EMAIL"
            ? data.message ?? "Unesite kod iz emaila."
            : "Unesite šestocifreni kod iz aplikacije za autentifikaciju.",
        );
        return;
      }

      setSuccess(data.message ?? "Uspješno ste prijavljeni.");
      const target = getPostLoginTarget(data, redirectTo);
      setTimeout(() => {
        router.push(target);
        router.refresh();
      }, 600);
    } catch {
      setError("Došlo je do greške pri povezivanju sa serverom.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaCode.replace(/\s/g, "") }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.message ?? "Verifikacija nije uspjela.");
        return;
      }

      setSuccess(data.message ?? "Uspješno ste prijavljeni.");
      const target = getPostLoginTarget(data, redirectTo);
      setTimeout(() => {
        router.push(target);
        router.refresh();
      }, 400);
    } catch {
      setError("Došlo je do greške pri povezivanju sa serverom.");
    } finally {
      setIsLoading(false);
    }
  };

  const mfaActive = mfaMethod !== null;

  return (
    <section className="container mx-auto flex min-h-[100dvh] flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <Card
        className={cn(
          "w-full max-w-md border bg-card/95 shadow-lg backdrop-blur-sm",
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
              {mfaActive ? <Shield className="size-5" aria-hidden /> : <Lock className="size-5" aria-hidden />}
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Prijava</CardTitle>
              {mfaActive && (
                <CardDescription className="text-muted-foreground">
                  {mfaMethod === "EMAIL"
                    ? `Kod je poslan na ${emailMask ?? "email"}.`
                    : "Unesite šestocifreni kod iz aplikacije u kojoj ste jednom skenirali QR kod pri podešavanju (npr. Google Authenticator)."}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 sm:px-8">
          {!mfaActive ? (
            <form onSubmit={onSubmitCredentials} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className={inputIconClass} aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ime@domen.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="username"
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
                    placeholder="Unesite lozinku"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
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

              {success && (
                <Alert className="rounded-xl border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <AlertTitle>Uspeh</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="h-10 w-full transition-transform hover:scale-[1.01] active:scale-[0.99] hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Prijava u toku..." : "Prijavi se"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmitMfa} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Jednokratni kod</Label>
                <div className="relative">
                  {mfaMethod === "EMAIL" ? (
                    <Smartphone className={inputIconClass} aria-hidden />
                  ) : (
                    <KeyRound className={inputIconClass} aria-hidden />
                  )}
                  <Input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={mfaMethod === "EMAIL" ? "000000" : "123456"}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                    disabled={isLoading}
                    maxLength={12}
                    className="h-10 pl-9 font-mono tracking-widest transition-[box-shadow] focus-visible:ring-2"
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

              {success && (
                <Alert className="rounded-xl border-sky-500/20 bg-sky-500/5">
                  <CheckCircle2 className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <AlertTitle>Informacija</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
                <Button
                  type="submit"
                  className="h-10 w-full flex-1 transition-transform hover:scale-[1.01] active:scale-[0.99] hover:bg-primary/90 sm:flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Provjera..." : "Potvrdi"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full transition-transform hover:scale-[1.01] active:scale-[0.99] sm:w-auto sm:min-w-[7rem]"
                  onClick={() => void cancelMfa()}
                  disabled={isLoading}
                >
                  Otkaži
                </Button>
              </div>
            </form>
          )}

          {!mfaActive && (
            <p className="text-center text-sm text-muted-foreground">
              Nemate nalog?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                Registrujte se
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
