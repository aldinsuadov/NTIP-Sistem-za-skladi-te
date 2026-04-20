-- AlterTable
ALTER TABLE "User" ADD COLUMN "firstName" VARCHAR(120);
ALTER TABLE "User" ADD COLUMN "lastName" VARCHAR(120);
ALTER TABLE "User" ADD COLUMN "phone" VARCHAR(32);
ALTER TABLE "User" ADD COLUMN "jmbg" VARCHAR(13);

-- CreateIndex
CREATE UNIQUE INDEX "User_jmbg_key" ON "User"("jmbg");
