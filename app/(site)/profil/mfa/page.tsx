import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { MfaSettings } from "./mfa-settings";

export const metadata: Metadata = {
  title: "TOTP",
  description: "Uključivanje aplikacije za autentifikaciju (TOTP)",
};

export default function ProfilMfaPage() {
  return (
    <section className="container mx-auto max-w-2xl space-y-8 px-4 py-10 sm:py-12">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Shield className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TOTP</h1>
            <p className="mt-1 text-muted-foreground">
              Uključite aplikaciju za autentifikaciju (Google Authenticator, Microsoft Authenticator i sl.). Pri sljedećim
              prijavama unosite šestocifreni kod.
            </p>
          </div>
        </div>
      </div>
      <MfaSettings />
    </section>
  );
}
