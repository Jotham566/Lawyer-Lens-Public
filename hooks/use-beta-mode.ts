"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicBetaMode, type PublicBetaMode } from "@/lib/api";

const BETA_MODE_KEY = ["public-beta-mode"] as const;

export function useBetaMode() {
  const { data, isLoading, isError } = useQuery<PublicBetaMode>({
    queryKey: BETA_MODE_KEY,
    queryFn: getPublicBetaMode,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    betaEnabled: data?.enabled ?? false,
    isLoading,
    isError,
  };
}
