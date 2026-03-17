import {
  LEGACY_CONTRACT_SESSION_STORAGE_KEY,
  clearActiveContractSessionId,
  clearContractSessionIdForPrompt,
  clearLegacyActiveContractSessionId,
  getActiveContractSessionId,
  getContractSessionIdForPrompt,
  getContractSessionStorageKey,
  setContractSessionIdForPrompt,
  setActiveContractSessionId,
} from "@/lib/utils/contract-session-storage";

describe("contract session storage", () => {
  const createStorage = () => {
    const store = new Map<string, string>();
    return {
      getItem: jest.fn((key: string) => store.get(key) ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
      }),
    };
  };

  it("scopes the active session key by user and organization", () => {
    expect(getContractSessionStorageKey("user-1", "org-1")).toBe(
      "law-lens-active-contract-session:user-1:org-1",
    );
    expect(getContractSessionStorageKey("user-1", "org-2")).toBe(
      "law-lens-active-contract-session:user-1:org-2",
    );
  });

  it("stores and clears sessions within the scoped key", () => {
    const storage = createStorage();

    setActiveContractSessionId(storage, "user-1", "org-1", "session-a");
    setActiveContractSessionId(storage, "user-1", "org-2", "session-b");

    expect(getActiveContractSessionId(storage, "user-1", "org-1")).toBe("session-a");
    expect(getActiveContractSessionId(storage, "user-1", "org-2")).toBe("session-b");

    clearActiveContractSessionId(storage, "user-1", "org-1");

    expect(getActiveContractSessionId(storage, "user-1", "org-1")).toBeNull();
    expect(getActiveContractSessionId(storage, "user-1", "org-2")).toBe("session-b");
  });

  it("clears the legacy unscoped storage key", () => {
    const storage = createStorage();

    storage.setItem(LEGACY_CONTRACT_SESSION_STORAGE_KEY, "legacy-session");
    expect(storage.getItem(LEGACY_CONTRACT_SESSION_STORAGE_KEY)).toBe("legacy-session");

    clearLegacyActiveContractSessionId(storage);

    expect(storage.getItem(LEGACY_CONTRACT_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("stores and resolves contract sessions by normalized prompt", () => {
    const storage = createStorage();

    setContractSessionIdForPrompt(storage, "user-1", "org-1", "Draft an NDA for Acme Ltd", "session-a");

    expect(
      getContractSessionIdForPrompt(storage, "user-1", "org-1", "  draft an nda   for acme ltd ")
    ).toBe("session-a");
  });

  it("clears prompt-scoped contract mappings without affecting others", () => {
    const storage = createStorage();

    setContractSessionIdForPrompt(storage, "user-1", "org-1", "Prompt A", "session-a");
    setContractSessionIdForPrompt(storage, "user-1", "org-1", "Prompt B", "session-b");
    clearContractSessionIdForPrompt(storage, "user-1", "org-1", "Prompt A");

    expect(getContractSessionIdForPrompt(storage, "user-1", "org-1", "Prompt A")).toBeNull();
    expect(getContractSessionIdForPrompt(storage, "user-1", "org-1", "Prompt B")).toBe("session-b");
  });
});
