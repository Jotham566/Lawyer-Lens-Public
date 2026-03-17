const CONTRACT_SESSION_STORAGE_KEY_PREFIX = "law-lens-active-contract-session";
export const LEGACY_CONTRACT_SESSION_STORAGE_KEY = CONTRACT_SESSION_STORAGE_KEY_PREFIX;
const CONTRACT_PROMPT_SESSION_STORAGE_KEY_PREFIX = "law-lens-contract-session-by-prompt";

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

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

function getContractPromptSessionStorageKey(
  userId: string | null | undefined,
  organizationId: string | null | undefined,
): string {
  const userSegment = normalizeStorageSegment(userId, "anonymous");
  const organizationSegment = normalizeStorageSegment(organizationId, "default");
  return `${CONTRACT_PROMPT_SESSION_STORAGE_KEY_PREFIX}:${userSegment}:${organizationSegment}`;
}

export function getContractSessionIdForPrompt(
  storage: Pick<Storage, "getItem">,
  userId: string | null | undefined,
  organizationId: string | null | undefined,
  prompt: string,
): string | null {
  const normalizedPrompt = normalizePrompt(prompt);
  if (!normalizedPrompt) return null;

  const raw = storage.getItem(getContractPromptSessionStorageKey(userId, organizationId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[normalizedPrompt] ?? null;
  } catch {
    return null;
  }
}

export function setContractSessionIdForPrompt(
  storage: Pick<Storage, "getItem" | "setItem">,
  userId: string | null | undefined,
  organizationId: string | null | undefined,
  prompt: string,
  sessionId: string,
): void {
  const normalizedPrompt = normalizePrompt(prompt);
  if (!normalizedPrompt) return;

  const key = getContractPromptSessionStorageKey(userId, organizationId);
  let parsed: Record<string, string> = {};

  try {
    const raw = storage.getItem(key);
    if (raw) {
      parsed = JSON.parse(raw) as Record<string, string>;
    }
  } catch {
    parsed = {};
  }

  parsed[normalizedPrompt] = sessionId;
  storage.setItem(key, JSON.stringify(parsed));
}

export function clearContractSessionIdForPrompt(
  storage: Pick<Storage, "getItem" | "setItem">,
  userId: string | null | undefined,
  organizationId: string | null | undefined,
  prompt: string,
): void {
  const normalizedPrompt = normalizePrompt(prompt);
  if (!normalizedPrompt) return;

  const key = getContractPromptSessionStorageKey(userId, organizationId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    delete parsed[normalizedPrompt];
    storage.setItem(key, JSON.stringify(parsed));
  } catch {
    storage.setItem(key, JSON.stringify({}));
  }
}
