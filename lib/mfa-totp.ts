import { generateSecret, generateURI, verifySync } from "otplib";

const ISSUER = "Špajz";

export function createTotpSetup(email: string) {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });
  return { secret, otpauthUrl };
}

export function verifyTotpCode(secret: string, token: string): boolean {
  const cleaned = token.replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(cleaned)) return false;
  const result = verifySync({
    secret,
    token: cleaned,
  });
  return result.valid === true;
}
