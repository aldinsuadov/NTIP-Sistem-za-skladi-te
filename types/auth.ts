import type { JWTPayload as JoseJwtPayload } from "jose";
import type { UserRole } from "@prisma/client";

export interface JwtPayload extends JoseJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
