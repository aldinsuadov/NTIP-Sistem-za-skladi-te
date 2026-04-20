"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { AlertCircle, Info, Shield, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MfaMethodState = "NONE" | "TOTP" | "EMAIL" | null;

const cardClass = cn(
  "border bg-card shadow-md",
  "rounded-2xl transition-shadow hover:shadow-lg",
);

export function MfaSettings() {
  const router = useRouter();
  const [mfaMethod, setMfaMethod] = useState<MfaMethodState>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const enrollAutoStarted = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/user/mfa", { credentials: "include" });
    if (res.status === 401) {
      router.replace("/login?next=/profil/mfa");
      return;
    }
    const data = (await res.json()) as {
      mfaMethod?: MfaMethodState;
      smtpConfigured?: boolean;
      message?: string;
    };
    if (!res.ok) {
      setError(data.message ?? "Ne mogu učitati postavke.");
      return;
    }
    setMfaMethod(data.mfaMethod ?? null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const startTotp = useCallback(async () => {
    setError(null);
    setInfo(null);
    const res = await fetch("/api/user/mfa/totp/setup", { method: "POST", credentials: "include" });
    const data = (await res.json()) as { secret?: string; otpauthUrl?: string; message?: string };
    if (!res.ok) {
      setError(data.message ?? "Greška.");
      return;
    }
    setTotpSecret(data.secret ?? null);
    setOtpauthUrl(data.otpauthUrl ?? null);
    setInfo(data.message ?? "Skenirajte QR kod u aplikaciji za autentifikaciju i unesite kod ispod.");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("enroll") === "1") {
        url.searchParams.delete("enroll");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      }
    }
  }, []);

  /** Nakon prve prijave (mfaMethod NONE) korisnik dolazi s ?enroll=1 — odmah generišemo QR. */
  useEffect(() => {
    if (loading || mfaMethod !== "NONE") return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("enroll") !== "1") return;
    if (enrollAutoStarted.current) return;
    enrollAutoStarted.current = true;
    void startTotp();
  }, [loading, mfaMethod, startTotp]);

  const confirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpSecret) return;
    setError(null);
    const res = await fetch("/api/user/mfa/totp/confirm", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: totpSecret, code: totpCode.trim() }),
    });
    const data = (await res.json()) as { message?: string };
    if (!res.ok) {
      setError(data.message ?? "Potvrda nije uspjela.");
      return;
    }
    setTotpSecret(null);
    setOtpauthUrl(null);
    setTotpCode("");
    setInfo(data.message ?? "TOTP je uključen.");
    await load();
    router.refresh();
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Učitavanje...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="size-4 shrink-0" />
          <AlertTitle>Greška</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {info && (
        <Alert className="rounded-xl border-sky-500/20 bg-sky-500/5">
          <Info className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <AlertTitle>Informacija</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      )}

      <Card className={cardClass}>
        <CardHeader className="px-6 sm:px-8">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" aria-hidden />
            <CardTitle className="text-lg font-semibold">Trenutno stanje</CardTitle>
          </div>
          <CardDescription>
            Metoda: <span className="font-medium text-foreground">{mfaMethod}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {mfaMethod === "NONE" && (
        <>
          <Card className={cardClass}>
            <CardHeader className="px-6 sm:px-8">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" aria-hidden />
                <CardTitle className="text-lg font-semibold">TOTP (aplikacija)</CardTitle>
              </div>
              <CardDescription>
                Skenirajte QR kod telefonom u Google Authenticator, Microsoft Authenticator ili sličnoj aplikaciji. Pri
                sljedećim prijavama unosite šestocifreni kod iz aplikacije (bez ponovnog skeniranja).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-8 sm:px-8">
              {!totpSecret ? (
                <Button
                  type="button"
                  onClick={() => void startTotp()}
                  className="w-full transition-transform hover:scale-[1.01] hover:bg-primary/90 sm:w-auto"
                >
                  Započni uključivanje TOTP
                </Button>
              ) : (
                <form onSubmit={confirmTotp} className="space-y-5">
                  {otpauthUrl && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-xl border bg-white p-4 shadow-inner">
                        <QRCode value={otpauthUrl} size={220} level="M" />
                      </div>
                      <p className="max-w-sm text-center text-xs text-muted-foreground">
                        Skenirajte QR kod kamerom u aplikaciji za autentifikaciju, zatim unesite trenutni kod ispod.
                      </p>
                    </div>
                  )}
                  <details className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/40">
                    <summary className="cursor-pointer font-medium text-foreground">Ručni unos (bez kamere)</summary>
                    <p className="mt-2 break-all text-muted-foreground">
                      Tajna (Base32): <code className="text-foreground">{totpSecret}</code>
                    </p>
                    {otpauthUrl && (
                      <p className="mt-2">
                        <a href={otpauthUrl} className="text-primary underline-offset-4 hover:underline">
                          Otvori otpauth vezu
                        </a>
                      </p>
                    )}
                  </details>
                  <div className="space-y-2">
                    <Label htmlFor="totp-confirm">Kod iz aplikacije</Label>
                    <Input
                      id="totp-confirm"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      inputMode="numeric"
                      required
                      className="h-10 transition-[box-shadow] focus-visible:ring-2"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full transition-transform hover:scale-[1.01] hover:bg-primary/90 sm:w-auto"
                  >
                    Potvrdi i uključi TOTP
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-sm">
        <Link href="/" className="font-medium text-primary underline-offset-4 transition-colors hover:underline">
          Nazad na početnu
        </Link>
      </p>
    </div>
  );
}
