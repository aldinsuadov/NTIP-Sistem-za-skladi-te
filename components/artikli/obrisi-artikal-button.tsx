"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  productId: number;
  productName: string;
};

export function ObrisiArtikalButton({ productId, productName }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Brisanje nije uspjelo.");
        setLoading(false);
        return;
      }
      router.push("/artikli");
      router.refresh();
    } catch {
      setError("Greška pri povezivanju sa serverom.");
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="size-3.5" aria-hidden />
        Obriši artikal
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 dark:bg-destructive/10">
      <Alert variant="destructive" className="rounded-lg border-destructive/40">
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <AlertTitle>Potvrda brisanja</AlertTitle>
        <AlertDescription>
          Artikal <span className="font-medium text-foreground">&quot;{productName}&quot;</span> bit će trajno uklonjen
          iz evidencije. Ova radnja se ne može poništiti.
        </AlertDescription>
      </Alert>
      {error && (
        <Alert variant="destructive" className="rounded-lg">
          <AlertTitle>Greška</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => {
            setShowConfirm(false);
            setError(null);
          }}
        >
          Odustani
        </Button>
        <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={() => void deleteProduct()}>
          {loading ? "Brisanje…" : "Da, obriši"}
        </Button>
      </div>
    </div>
  );
}
