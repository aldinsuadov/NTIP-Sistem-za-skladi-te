import type { HealthResponse } from "@/types/api";

export async function getHealth(): Promise<HealthResponse> {
  return Promise.resolve({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
