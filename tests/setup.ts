import { beforeEach, vi } from "vitest";
import { prismaMock } from "./helpers/prisma-mock";

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});
