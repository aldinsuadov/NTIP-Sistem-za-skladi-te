import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("vraća 200 i briše kolačiće", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/auth_token=/);
    expect(setCookie).toMatch(/mfa_pending=/);
    expect(setCookie).toMatch(/mfa_enrollment_pending=/);
  });
});
