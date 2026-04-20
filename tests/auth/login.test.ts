import { hash } from "bcryptjs";
import { MfaMethod, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSmtpConfigured, sendLoginMfaCode } from "@/lib/mfa-mailer";

vi.mock("@/lib/mfa-mailer", () => ({
  isSmtpConfigured: vi.fn(() => false),
  sendLoginMfaCode: vi.fn().mockResolvedValue(undefined),
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { prismaMock } from "@/tests/helpers/prisma-mock";

function loginRequest(body: unknown, cookieHeader?: string) {
  return new NextRequest(new URL("http://localhost/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.mocked(isSmtpConfigured).mockReturnValue(false);
    vi.mocked(sendLoginMfaCode).mockClear();
    prismaMock.user.update.mockResolvedValue({} as never);
  });

  it("vraća 400 bez emaila ili lozinke", async () => {
    const res = await loginPost(loginRequest({ email: "" }));
    expect(res.status).toBe(400);
  });

  it("vraća 401 za nepoznatog korisnika", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await loginPost(loginRequest({ email: "nema@nema.com", password: "x" }));
    expect(res.status).toBe(401);
  });

  it("vraća 401 za pogrešnu lozinku", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      password: await hash("tacno", 10),
      approved: true,
      role: UserRole.USER,
      mfaMethod: MfaMethod.NONE,
      totpSecret: null,
    } as never);

    const res = await loginPost(loginRequest({ email: "a@b.com", password: "pogresno" }));
    expect(res.status).toBe(401);
  });

  it("vraća 403 ako nalog nije odobren", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@b.com",
      password: await hash("lozinka1", 10),
      approved: false,
      role: UserRole.USER,
      mfaMethod: MfaMethod.NONE,
      totpSecret: null,
    } as never);

    const res = await loginPost(loginRequest({ email: "a@b.com", password: "lozinka1" }));
    expect(res.status).toBe(403);
  });

  it("bez uključenog MFA postavlja enrollment kolačić, ne auth_token", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 5,
      email: "ok@test.com",
      password: await hash("lozinka1", 10),
      approved: true,
      role: UserRole.USER,
      mfaMethod: MfaMethod.NONE,
      totpSecret: null,
    } as never);

    const res = await loginPost(loginRequest({ email: "ok@test.com", password: "lozinka1" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      enrollmentRequired?: boolean;
      user: { email: string };
    };
    expect(data.enrollmentRequired).toBe(true);
    expect(data.user.email).toBe("ok@test.com");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("mfa_enrollment_pending=");
    expect(setCookie).not.toContain("auth_token=");
  });

  it("vraća mfaRequired za TOTP", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      email: "mfa@test.com",
      password: await hash("lozinka1", 10),
      approved: true,
      role: UserRole.USER,
      mfaMethod: MfaMethod.TOTP,
      totpSecret: "JBSWY3DPEHPK3PXP",
    } as never);

    const res = await loginPost(loginRequest({ email: "mfa@test.com", password: "lozinka1" }));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { mfaRequired: boolean; mfaMethod: string };
    expect(data.mfaRequired).toBe(true);
    expect(data.mfaMethod).toBe("TOTP");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("mfa_pending=");
  });

  it("vraća 503 za EMAIL MFA bez SMTP-a", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 8,
      email: "em@test.com",
      password: await hash("lozinka1", 10),
      approved: true,
      role: UserRole.USER,
      mfaMethod: MfaMethod.EMAIL,
      totpSecret: null,
    } as never);

    const res = await loginPost(loginRequest({ email: "em@test.com", password: "lozinka1" }));
    expect(res.status).toBe(503);
  });

  it("sa SMTP-om šalje email kod za EMAIL MFA", async () => {
    vi.mocked(isSmtpConfigured).mockReturnValue(true);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 9,
      email: "smtp@test.com",
      password: await hash("lozinka1", 10),
      approved: true,
      role: UserRole.USER,
      mfaMethod: MfaMethod.EMAIL,
      totpSecret: null,
    } as never);

    const res = await loginPost(loginRequest({ email: "smtp@test.com", password: "lozinka1" }));

    expect(res.status).toBe(200);
    expect(sendLoginMfaCode).toHaveBeenCalled();
    const data = (await res.json()) as { mfaRequired: boolean; mfaMethod: string };
    expect(data.mfaRequired).toBe(true);
    expect(data.mfaMethod).toBe("EMAIL");
    expect(res.headers.get("set-cookie") ?? "").toContain("mfa_pending=");
  });
});
