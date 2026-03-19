import { useLibraryStore } from "@/lib/stores/library-store";
import { useResearchSessionsStore } from "@/lib/stores/research-store";

describe("user-scoped persisted stores", () => {
  beforeEach(() => {
    localStorage.clear();

    useResearchSessionsStore.setState({
      sessions: [],
      userId: null,
    });
    useLibraryStore.setState({
      userId: null,
      savedDocuments: [],
      readingHistory: [],
    });
  });

  it("isolates research sessions per authenticated user", () => {
    const researchStore = useResearchSessionsStore.getState();

    researchStore.setUserId("user-1");
    useResearchSessionsStore.getState().addSession({
      id: "session-1",
      query: "VAT on exports",
      title: "VAT on exports",
      status: "complete",
      createdAt: "2026-03-19T09:00:00.000Z",
      reportReady: true,
    });

    useResearchSessionsStore.getState().setUserId("user-2");
    expect(useResearchSessionsStore.getState().sessions).toEqual([]);

    useResearchSessionsStore.getState().addSession({
      id: "session-2",
      query: "PAYE treatment",
      title: "PAYE treatment",
      status: "researching",
      createdAt: "2026-03-19T10:00:00.000Z",
      reportReady: false,
    });

    useResearchSessionsStore.getState().setUserId("user-1");
    expect(useResearchSessionsStore.getState().sessions.map((session) => session.id)).toEqual([
      "session-1",
    ]);

    useResearchSessionsStore.getState().setUserId("user-2");
    expect(useResearchSessionsStore.getState().sessions.map((session) => session.id)).toEqual([
      "session-2",
    ]);
  });

  it("isolates saved documents per authenticated user", () => {
    const libraryStore = useLibraryStore.getState();

    libraryStore.setUserId("user-1");
    useLibraryStore.getState().saveDocument({
      id: "doc-1",
      humanReadableId: "UGA-ACT-2024-001",
      title: "Income Tax Act",
      documentType: "act",
    });

    useLibraryStore.getState().setUserId("user-2");
    expect(useLibraryStore.getState().savedDocuments).toEqual([]);

    useLibraryStore.getState().saveDocument({
      id: "doc-2",
      humanReadableId: "UGA-SC-2024-001",
      title: "URA v Example Ltd",
      documentType: "judgment",
    });

    useLibraryStore.getState().setUserId("user-1");
    expect(useLibraryStore.getState().savedDocuments.map((document) => document.id)).toEqual([
      "doc-1",
    ]);

    useLibraryStore.getState().setUserId("user-2");
    expect(useLibraryStore.getState().savedDocuments.map((document) => document.id)).toEqual([
      "doc-2",
    ]);
  });
});
