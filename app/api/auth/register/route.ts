import { hash } from "bcryptjs";
import { Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { isValidPhone, normalizeJmbg, normalizePhone } from "@/lib/registration";
import { prisma } from "@/lib/prisma";

interface RegisterBody {
  email?: string;
  password?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jmbg?: string;
}

function normalizeName(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ message: "Neispravan zahtjev." }, { status: 400 });
  }

  try {
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const firstName = normalizeName(body.firstName);
    const lastName = normalizeName(body.lastName);
    const phone = normalizePhone(body.phone ?? "");
    const jmbgNorm = normalizeJmbg(body.jmbg ?? "");

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { message: "Email i password (min 6 karaktera) su obavezni." },
        { status: 400 },
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ message: "Ime i prezime su obavezni." }, { status: 400 });
    }

    if (firstName.length < 2 || lastName.length < 2) {
      return NextResponse.json(
        { message: "Ime i prezime moraju imati najmanje 2 karaktera." },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json({ message: "Broj telefona je obavezan." }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { message: "Unesite ispravan broj telefona (najmanje 8 cifara)." },
        { status: 400 },
      );
    }

    if (!jmbgNorm) {
      return NextResponse.json(
        { message: "JMBG mora imati tačno 13 cifara." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email je vec zauzet." }, { status: 409 });
    }

    const jmbgTaken = await prisma.user.findFirst({
      where: { jmbg: jmbgNorm },
      select: { id: true },
    });
    if (jmbgTaken) {
      return NextResponse.json(
        { message: "Korisnik s ovim JMBG-om je već registrovan." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: body.role ?? UserRole.USER,
        approved: false,
        firstName,
        lastName,
        phone,
        jmbg: jmbgNorm,
      },
      select: {
        id: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        phone: true,
        jmbg: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registracija uspesna. Nalog ceka odobrenje administratora.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const fields = (error.meta as { target?: string[] } | undefined)?.target ?? [];
        const hint =
          fields.includes("jmbg") || fields.includes("User_jmbg_key")
            ? "JMBG je već registrovan."
            : fields.includes("email") || fields.includes("User_email_key")
              ? "Email je već zauzet."
              : "Podatak je već u upotrebi.";
        return NextResponse.json({ message: hint }, { status: 409 });
      }
      if (error.code === "P2022") {
        return NextResponse.json(
          {
            message:
              "Baza podataka nije ažurirana (nedostaju kolone). Na serveru pokrenite: npx prisma migrate deploy",
          },
          { status: 503 },
        );
      }
    }

    const devDetail =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? ` (${error.message})`
        : "";
    return NextResponse.json(
      { message: `Neuspjela registracija.${devDetail}` },
      { status: 500 },
    );
  }
}
