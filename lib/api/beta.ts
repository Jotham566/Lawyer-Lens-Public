import { apiFetch } from "./client";

export interface PublicBetaMode {
  enabled: boolean;
}

export async function getPublicBetaMode(): Promise<PublicBetaMode> {
  return apiFetch<PublicBetaMode>("/beta/mode", {
    method: "GET",
  });
}

