import { Suspense } from "react";
import type { Metadata } from "next";
import { ArtikliClient } from "./artikli-client";

export const metadata: Metadata = {
  title: "Artikli",
  description: "Pregled artikala u skladištu",
};

function ArtikliFallback() {
  return (
    <section className="container mx-auto max-w-5xl px-4 py-10">
      <p className="text-muted-foreground text-sm">Učitavanje...</p>
    </section>
  );
}

export default function ArtikliPage() {
  return (
    <Suspense fallback={<ArtikliFallback />}>
      <ArtikliClient />
    </Suspense>
  );
}
