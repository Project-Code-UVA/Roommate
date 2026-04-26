/**
 * Tests for useMessageActions hook.
 * Covers: MSG-01, MSG-04, MSG-06
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { resetAllMocks } from "../setup";

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const mockSendMessage = jest.fn();
const mockAddReaction = jest.fn();
const mockRemoveReactionForMessageUser = jest.fn();
const mockDeleteMessageForMe = jest.fn();

jest.mock("@/services/message-service", () => ({
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  addReaction: (...args: unknown[]) => mockAddReaction(...args),
  removeReactionForMessageUser: (...args: unknown[]) =>
    mockRemoveReactionForMessageUser(...args),
  deleteMessageForMe: (...args: unknown[]) => mockDeleteMessageForMe(...args),
}));

// Mock expo-clipboard
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Import hook after mocks
// ---------------------------------------------------------------------------

import { useMessageActions } from "@/hooks/use-message-actions";

const TEST_USER_ID = "current-user-id";
const TEST_THREAD_ID = "thread-123";

describe("useMessageActions", () => {
  beforeEach(() => {
    resetAllMocks();
    mockSendMessage.mockReset();
    mockAddReaction.mockReset();
    mockRemoveReactionForMessageUser.mockReset();
    mockDeleteMessageForMe.mockReset();
  });

  it("exposes sendText, sendMedia, sendReaction, removeReaction, sendReply, copyText, deleteForMe", () => {
    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    expect(typeof result.current.sendText).toBe("function");
    expect(typeof result.current.sendMedia).toBe("function");
    expect(typeof result.current.sendReaction).toBe("function");
    expect(typeof result.current.removeReaction).toBe("function");
    expect(typeof result.current.sendReply).toBe("function");
    expect(typeof result.current.copyText).toBe("function");
    expect(typeof result.current.deleteForMe).toBe("function");
  });

  it("sendText calls sendMessage service with correct params", async () => {
    mockSendMessage.mockResolvedValueOnce({
      data: { message_id: "msg-1" },
      error: null,
    });

    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    await act(async () => {
      await result.current.sendText("Hello world");
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    const [params, senderId] = mockSendMessage.mock.calls[0];
    expect(params.thread_id).toBe(TEST_THREAD_ID);
    expect(params.body).toBe("Hello world");
    expect(params.media_url).toBeNull();
    expect(senderId).toBe(TEST_USER_ID);
    expect(params.message_id).toBeTruthy(); // client-generated UUID
  });

  it("sendReaction calls addReaction service", async () => {
    mockAddReaction.mockResolvedValueOnce({
      data: { id: "r-1", emoji: "heart" },
      error: null,
    });

    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    await act(async () => {
      await result.current.sendReaction("msg-1", "heart");
    });

    expect(mockAddReaction).toHaveBeenCalledWith("msg-1", TEST_USER_ID, "heart");
  });

  it("removeReaction calls removeReaction service", async () => {
    mockRemoveReactionForMessageUser.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    await act(async () => {
      await result.current.removeReaction("msg-1");
    });

    expect(mockRemoveReactionForMessageUser).toHaveBeenCalledWith(
      "msg-1",
      TEST_USER_ID,
    );
  });

  it("sendReply calls sendMessage with reply_to_id", async () => {
    mockSendMessage.mockResolvedValueOnce({
      data: { message_id: "msg-2" },
      error: null,
    });

    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    await act(async () => {
      await result.current.sendReply("Reply text", "original-msg-id");
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    const [params] = mockSendMessage.mock.calls[0];
    expect(params.reply_to_id).toBe("original-msg-id");
    expect(params.body).toBe("Reply text");
  });

  it("copyText copies text to clipboard", async () => {
    const Clipboard = require("expo-clipboard");

    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    await act(async () => {
      await result.current.copyText("Some text to copy");
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith("Some text to copy");
  });

  it("deleteForMe calls deleteMessageForMe service", async () => {
    mockDeleteMessageForMe.mockResolvedValueOnce({ success: true, error: null });

    const { result } = renderHook(() =>
      useMessageActions(TEST_THREAD_ID, TEST_USER_ID),
    );

    await act(async () => {
      await result.current.deleteForMe("msg-1");
    });

    expect(mockDeleteMessageForMe).toHaveBeenCalledWith("msg-1", TEST_USER_ID);
  });
});
