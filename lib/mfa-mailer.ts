import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendLoginMfaCode(to: string, code: string): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    throw new Error("SMTP nije konfigurisan (SMTP_HOST).");
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!from) {
    throw new Error("SMTP_FROM ili SMTP_USER mora biti postavljen.");
  }

  await transport.sendMail({
    from,
    to,
    subject: "Kod za prijavu — skladište",
    text: `Vaš jednokratni kod za prijavu: ${code}\n\nKod važi 10 minuta. Ako niste vi zatražili prijavu, ignorišite ovu poruku.`,
  });
}
