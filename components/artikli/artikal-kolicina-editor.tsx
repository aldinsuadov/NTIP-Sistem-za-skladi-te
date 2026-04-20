"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ArtikalKolicinaEditorProps {
  productId: number;
  initialQuantity: number;
}

export function ArtikalKolicinaEditor({ productId, initialQuantity }: ArtikalKolicinaEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialQuantity));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(String(initialQuantity));
  }, [initialQuantity]);

  const onSave = async () => {
    setError(null);
    const n = Number(value);
    if (value.trim() === "" || Number.isNaN(n) || !Number.isInteger(n) || n < 0) {
      setError("Unesite cijeli broj ≥ 0.");
      return;
    }
    if (n === initialQuantity) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: n }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Količina nije sačuvana.");
        return;
      }
      router.refresh();
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-b py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Label htmlFor="artikal-kolicina" className="text-muted-foreground shrink-0 font-normal">
          Količina na skladištu
        </Label>
        <div className="flex w-full flex-col gap-2 sm:max-w-xs sm:flex-row sm:items-center sm:justify-end">
          <Input
            id="artikal-kolicina"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            className="tabular-nums sm:max-w-[8rem]"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={isSaving}
            onClick={() => void onSave()}
          >
            {isSaving ? "Spremanje..." : "Sačuvaj"}
          </Button>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
