import { useChatStore, type Conversation } from "@/lib/stores/chat-store";
import { getConversation, getConversations } from "@/lib/api/chat";

jest.mock("@/lib/api/chat", () => ({
  getConversations: jest.fn(),
  getConversation: jest.fn(),
  deleteConversation: jest.fn(),
  updateConversation: jest.fn(),
}));

const mockedGetConversations = getConversations as jest.MockedFunction<typeof getConversations>;
const mockedGetConversation = getConversation as jest.MockedFunction<typeof getConversation>;

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Local Conversation",
    messages: [
      {
        id: "msg-local-1",
        role: "user",
        content: "Local cached message",
        timestamp: "2026-03-19T09:00:00.000Z",
      },
    ],
    createdAt: "2026-03-19T09:00:00.000Z",
    updatedAt: "2026-03-19T09:05:00.000Z",
    isLocalOnly: false,
    needsHydration: false,
    isArchived: false,
    isStarred: false,
    ...overrides,
  };
}

describe("chat store conversation sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useChatStore.setState({
      currentConversationId: null,
      conversations: [],
      isLoading: false,
      isFetchingHistory: false,
      error: null,
      userId: "user-1",
    });
    useChatStore.persist.clearStorage();
  });

  it("marks persisted conversations for hydration when the backend copy is newer", async () => {
    mockedGetConversations.mockResolvedValue({
      conversations: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Server Conversation",
          is_starred: false,
          is_archived: false,
          created_at: "2026-03-19T09:00:00.000Z",
          updated_at: "2026-03-19T10:00:00.000Z",
          message_count: 2,
          scope: null,
        },
      ],
    });

    useChatStore.setState({
      conversations: [makeConversation()],
    });

    await useChatStore.getState().fetchConversations();

    const conversation = useChatStore.getState().conversations[0];
    expect(conversation.title).toBe("Server Conversation");
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.needsHydration).toBe(true);
    expect(conversation.updatedAt).toBe("2026-03-19T10:00:00.000Z");
  });

  it("rehydrates a persisted conversation from the backend and clears the hydration flag", async () => {
    mockedGetConversation.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Server Conversation",
      created_at: "2026-03-19T09:00:00.000Z",
      updated_at: "2026-03-19T10:00:00.000Z",
      scope: null,
      messages: [
        {
          id: "msg-server-1",
          role: "user",
          content: "Server user message",
          citations: [],
          tokens_used: 0,
          timestamp: "2026-03-19T09:00:00.000Z",
          provider: null,
          verification: null,
          confidence_info: null,
        },
        {
          id: "msg-server-2",
          role: "assistant",
          content: "Server assistant message",
          citations: [],
          tokens_used: 42,
          timestamp: "2026-03-19T09:01:00.000Z",
          provider: "azure_ai",
          verification: null,
          confidence_info: null,
        },
      ],
    });

    useChatStore.setState({
      conversations: [
        makeConversation({
          needsHydration: true,
        }),
      ],
    });

    await useChatStore.getState().fetchConversation("11111111-1111-4111-8111-111111111111");

    const conversation = useChatStore.getState().conversations[0];
    expect(conversation.needsHydration).toBe(false);
    expect(conversation.isLocalOnly).toBe(false);
    expect(conversation.messages.map((message) => message.content)).toEqual([
      "Server user message",
      "Server assistant message",
    ]);
    expect(conversation.updatedAt).toBe("2026-03-19T10:00:00.000Z");
  });

  it("preserves local-only drafts that have not been synced to the backend", async () => {
    mockedGetConversations.mockResolvedValue({
      conversations: [],
    });

    useChatStore.setState({
      conversations: [
        makeConversation({
          id: "local-draft-1",
          title: "Draft",
          isLocalOnly: true,
          needsHydration: false,
          updatedAt: "2026-03-19T11:00:00.000Z",
        }),
      ],
    });

    await useChatStore.getState().fetchConversations();

    const [conversation] = useChatStore.getState().conversations;
    expect(conversation.id).toBe("local-draft-1");
    expect(conversation.isLocalOnly).toBe(true);
    expect(conversation.title).toBe("Draft");
  });
});
