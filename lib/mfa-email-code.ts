import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashEmailMfaCode(code: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return createHmac("sha256", secret).update(`mfa-email|${code}`).digest("hex");
}

export function verifyEmailMfaCode(code: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  try {
    const a = Buffer.from(hashEmailMfaCode(code.trim()), "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
