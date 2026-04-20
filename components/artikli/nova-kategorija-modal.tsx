"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NovaKategorijaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (category: { id: number; name: string }) => void;
}

export function NovaKategorijaModal({ open, onClose, onCreated }: NovaKategorijaModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Unesite naziv kategorije.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json()) as {
        message?: string;
        category?: { id: number; name: string };
      };
      if (!res.ok) {
        setError(data.message ?? "Kategorija nije kreirana.");
        return;
      }
      if (data.category) {
        onCreated({ id: data.category.id, name: data.category.name });
      }
      onClose();
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nova-kategorija-title"
        className="relative z-10 w-full max-w-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Card>
          <form onSubmit={(e) => void submit(e)}>
            <CardHeader>
              <CardTitle id="nova-kategorija-title">Nova kategorija</CardTitle>
              <CardDescription>
                Kategorija će odmah biti dostupna u padajućem meniju.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="nova-kategorija-naziv">Naziv</Label>
                <Input
                  id="nova-kategorija-naziv"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  placeholder="npr. Elektronika"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t bg-muted/30">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Spremanje..." : "Kreiraj kategoriju"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
