import { NextResponse } from "next/server";
import {
  authCookie,
  mfaEnrollmentPendingCookie,
  mfaPendingCookie,
} from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Uspjesna odjava." });
  response.cookies.delete(authCookie.name);
  response.cookies.delete(mfaPendingCookie.name);
  response.cookies.delete(mfaEnrollmentPendingCookie.name);
  return response;
}
