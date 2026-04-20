/** Normalizacija JMBG: tačno 13 cifara. */
export function normalizeJmbg(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 13 ? digits : null;
}

export function normalizePhone(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Minimalna provjera telefona: dovoljno cifara (međunarodni ili lokalni format). */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
