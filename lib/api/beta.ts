import { apiFetch } from "./client";

export interface PublicBetaMode {
  enabled: boolean;
}

export async function getPublicBetaMode(): Promise<PublicBetaMode> {
  return apiFetch<PublicBetaMode>(`/beta/mode?_=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
  });
}
