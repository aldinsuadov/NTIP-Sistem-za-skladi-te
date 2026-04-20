import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ArtikalNotFound() {
  return (
    <section className="container mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Artikal nije pronađen</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Traženi artikal ne postoji ili je uklonjen.
      </p>
      <Link
        href="/artikli"
        className={buttonVariants({ variant: "default", className: "mt-6 inline-flex" })}
      >
        Povratak na listu
      </Link>
    </section>
  );
}
