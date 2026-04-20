import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

/** TOTP je obavezan — isključivanje nije dozvoljeno. */
export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Niste prijavljeni." }, { status: 401 });
  }

  return NextResponse.json(
    { message: "TOTP je obavezan i ne može se isključiti." },
    { status: 403 },
  );
}
