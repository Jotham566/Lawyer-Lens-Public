const CONTRACT_SESSION_STORAGE_KEY_PREFIX = "law-lens-active-contract-session";
export const LEGACY_CONTRACT_SESSION_STORAGE_KEY = CONTRACT_SESSION_STORAGE_KEY_PREFIX;

function normalizeStorageSegment(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function getContractSessionStorageKey(
  userId: string | null | undefined,
  organizationId: string | null | undefined,
): string {
  const userSegment = normalizeStorageSegment(userId, "anonymous");
  const organizationSegment = normalizeStorageSegment(organizationId, "default");
  return `${CONTRACT_SESSION_STORAGE_KEY_PREFIX}:${userSegment}:${organizationSegment}`;
}

export function getActiveContractSessionId(
  storage: Pick<Storage, "getItem">,
  userId: string | null | undefined,
  organizationId: string | null | undefined,
): string | null {
  return storage.getItem(getContractSessionStorageKey(userId, organizationId));
}

export function setActiveContractSessionId(
  storage: Pick<Storage, "setItem">,
  userId: string | null | undefined,
  organizationId: string | null | undefined,
  sessionId: string,
): void {
  storage.setItem(getContractSessionStorageKey(userId, organizationId), sessionId);
}

export function clearActiveContractSessionId(
  storage: Pick<Storage, "removeItem">,
  userId: string | null | undefined,
  organizationId: string | null | undefined,
): void {
  storage.removeItem(getContractSessionStorageKey(userId, organizationId));
}

export function clearLegacyActiveContractSessionId(
  storage: Pick<Storage, "removeItem">,
): void {
  storage.removeItem(LEGACY_CONTRACT_SESSION_STORAGE_KEY);
}
