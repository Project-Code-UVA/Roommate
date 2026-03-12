/**
 * Tests for useChatMessages hook.
 * Covers: MSG-01, MSG-03, MSG-04
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { resetAllMocks, mockSupabase } from "../setup";

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const mockMarkThreadDelivered = jest.fn();

jest.mock("@/services/thread-service", () => ({
  markThreadDelivered: (...args: unknown[]) => mockMarkThreadDelivered(...args),
}));

// ---------------------------------------------------------------------------
// Mock Supabase Realtime channel
// ---------------------------------------------------------------------------

const mockUnsubscribe = jest.fn();
const mockChannelOn = jest.fn();
const mockSubscribe = jest.fn();

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: mockUnsubscribe,
};

// Override channel mock
mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
mockSupabase.removeChannel = jest.fn();

// ---------------------------------------------------------------------------
// Import hook after mocks
// ---------------------------------------------------------------------------

import { useChatMessages } from "@/hooks/use-chat-messages";

const TEST_USER_ID = "current-user-id";
const TEST_THREAD_ID = "thread-123";

function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: `msg-${Math.random().toString(36).slice(2, 8)}`,
    thread_id: TEST_THREAD_ID,
    sender_id: "other-user-id",
    body: "Hello",
    media_url: null,
    reply_to_id: null,
    delivered_at: null,
    read_at: null,
    created_at: "2026-03-11T00:00:00Z",
    reply_to: null,
    ...overrides,
  };
}

describe("useChatMessages", () => {
  beforeEach(() => {
    resetAllMocks();
    mockMarkThreadDelivered.mockReset();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
    mockChannel.unsubscribe.mockReset();
    (mockSupabase.channel as jest.Mock).mockReturnValue(mockChannel);
    (mockSupabase.removeChannel as jest.Mock).mockReset();
  });

  it("fetches initial messages on mount", async () => {
    const messages = [createMockMessage(), createMockMessage()];
    const chain = createChainMock({ data: messages, error: null });
    mockSupabase.from.mockReturnValueOnce(chain);

    const { result } = renderHook(() =>
      useChatMessages(TEST_THREAD_ID, TEST_USER_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("messages");
    expect(result.current.messages).toHaveLength(2);
  });

  it("subscribes to Realtime channel for the thread", async () => {
    const chain = createChainMock({ data: [], error: null });
    mockSupabase.from.mockReturnValueOnce(chain);

    renderHook(() => useChatMessages(TEST_THREAD_ID, TEST_USER_ID));

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    const channelName = (mockSupabase.channel as jest.Mock).mock.calls[0][0];
    expect(channelName).toContain(TEST_THREAD_ID);
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("cleans up Realtime subscription on unmount", async () => {
    const chain = createChainMock({ data: [], error: null });
    mockSupabase.from.mockReturnValueOnce(chain);

    const { unmount } = renderHook(() =>
      useChatMessages(TEST_THREAD_ID, TEST_USER_ID),
    );

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });

  it("exposes loadMore for pagination", async () => {
    const initialMessages = Array.from({ length: 25 }, (_, i) =>
      createMockMessage({
        id: `msg-${i}`,
        created_at: `2026-03-11T00:${String(i).padStart(2, "0")}:00Z`,
      }),
    );
    const chain = createChainMock({ data: initialMessages, error: null });
    mockSupabase.from.mockReturnValueOnce(chain);

    const { result } = renderHook(() =>
      useChatMessages(TEST_THREAD_ID, TEST_USER_ID),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
    expect(typeof result.current.loadMore).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Helper: chainable query mock
// ---------------------------------------------------------------------------

function createChainMock(resolvedValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "single", "maybeSingle", "match",
    "order", "limit", "range", "filter", "not", "or",
    "is", "in", "contains", "overlaps", "lt",
  ];

  methods.forEach((method) => {
    chain[method] = jest.fn().mockReturnValue(chain);
  });

  Object.defineProperty(chain, "then", {
    value: jest.fn((resolve?: (v: unknown) => unknown) =>
      Promise.resolve(resolvedValue).then(resolve),
    ),
    writable: true,
    configurable: true,
  });

  return chain;
}
