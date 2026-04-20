import Link from "next/link";
import Image from "next/image";
import { Clock, Package, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_BG = "/warehouse-hero.png";

type HomeProps = {
  searchParams?: Promise<{ cekanjeOdobrenja?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const sp = searchParams != null ? await searchParams : {};
  const cekanjeOdobrenja = sp.cekanjeOdobrenja === "1";

  return (
    <section className="home-landing relative min-h-[calc(100vh-7.5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={HERO_BG}
          alt=""
          fill
          priority
          className="object-cover opacity-[0.38]"
          sizes="100vw"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/92 dark:from-background/90 dark:via-background/80 dark:to-background/95"
          aria-hidden
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-2xl space-y-10 px-4 py-12 lg:space-y-12 lg:py-16">
        {cekanjeOdobrenja && (
          <Alert className="rounded-xl border-primary/25 bg-primary/5">
            <Clock className="size-4 shrink-0 text-primary" aria-hidden />
            <AlertTitle>Registracija primljena</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Sačekajte da administrator odobri vaš nalog. Nakon odobrenja možete se prijaviti na dugme ispod.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <Package className="size-3.5" aria-hidden />
            Interni sistem
          </div>
          <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            <span>Skladište</span>
            <span className="text-muted-foreground/50 font-light" aria-hidden>
              |
            </span>
            <span className="font-semibold tracking-[0.2em] text-primary">ŠPAJZ</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Centralno mjesto za evidenciju artikala i pregled stanja skladišta. Novi korisnici se mogu registrovati, a
            pristup odobrava administrator.
          </p>
          <div className="flex flex-col gap-3 sm:max-w-md sm:flex-row">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full justify-center shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] hover:bg-primary/90",
              )}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full justify-center border-border/80 bg-background/70 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02] active:scale-[0.98] hover:bg-background/90",
              )}
            >
              Register
            </Link>
          </div>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>Pristup je ograničen na odobrene naloge.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
