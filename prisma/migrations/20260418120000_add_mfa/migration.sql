-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('NONE', 'TOTP', 'EMAIL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "mfaMethod" "MfaMethod" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "mfaEmailCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN "mfaEmailCodeExpiresAt" TIMESTAMP(3);
