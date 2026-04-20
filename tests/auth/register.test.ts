import { compare } from "bcryptjs";
import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { prismaMock } from "@/tests/helpers/prisma-mock";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  email: "novi@test.com",
  password: "lozinka1",
  firstName: "Marko",
  lastName: "Marković",
  phone: "+38761000000",
  jmbg: "2902990170028",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.mocked(prismaMock.user.findUnique).mockReset();
    vi.mocked(prismaMock.user.findFirst).mockReset();
    vi.mocked(prismaMock.user.create).mockReset();
  });

  it("vraća 400 ako nedostaju polja", async () => {
    const res = await POST(jsonRequest({ email: "a@b.com" }));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { message: string };
    expect(data.message).toMatch(/obavezni/i);
  });

  it("vraća 400 bez imena", async () => {
    const res = await POST(
      jsonRequest({
        ...validPayload,
        firstName: "",
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { message: string };
    expect(data.message).toMatch(/Ime/i);
  });

  it("vraća 409 ako email postoji", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "x@y.com",
    } as never);

    const res = await POST(
      jsonRequest({ ...validPayload, email: "x@y.com" }),
    );
    expect(res.status).toBe(409);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("vraća 409 ako JMBG postoji", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue({ id: 99 } as never);

    const res = await POST(jsonRequest(validPayload));
    expect(res.status).toBe(409);
    const data = (await res.json()) as { message: string };
    expect(data.message).toMatch(/JMBG/i);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("kreira korisnika i vraća 201", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 2,
      email: "novi@test.com",
      role: UserRole.USER,
      approved: false,
      createdAt: new Date(),
      firstName: "Marko",
      lastName: "Marković",
      phone: "+38761000000",
      jmbg: "2902990170028",
    } as never);

    const res = await POST(jsonRequest(validPayload));

    expect(res.status).toBe(201);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    const call = prismaMock.user.create.mock.calls[0][0];
    expect(call.data.email).toBe("novi@test.com");
    expect(call.data.firstName).toBe("Marko");
    expect(call.data.lastName).toBe("Marković");
    expect(call.data.phone).toBe("+38761000000");
    expect(call.data.jmbg).toBe("2902990170028");
    expect(call.data.role).toBe(UserRole.USER);
    expect(call.data.approved).toBe(false);
    const hashed = call.data.password as string;
    expect(hashed).toMatch(/^\$2[aby]\$/);
    expect(await compare("lozinka1", hashed)).toBe(true);

    const data = (await res.json()) as { user: { email: string } };
    expect(data.user.email).toBe("novi@test.com");
  });
});
