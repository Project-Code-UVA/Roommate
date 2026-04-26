/**
 * Tests for message-service.
 * Covers: MSG-01, MSG-03, MSG-04, MSG-06
 */

import { resetAllMocks, mockSupabase } from "../setup";
import {
  sendMessage,
  addReaction,
  removeReaction,
  removeReactionForMessageUser,
  updateDeliveryStatus,
  deleteMessageForMe,
} from "@/services/message-service";
import type { SendMessageParams } from "@/types/chat";

const TEST_USER_ID = "test-user-id";
const TEST_THREAD_ID = "thread-123";
const TEST_MESSAGE_ID = "msg-456";

describe("message-service", () => {
  beforeEach(resetAllMocks);

  describe("sendMessage", () => {
    const params: SendMessageParams = {
      thread_id: TEST_THREAD_ID,
      body: "Hello!",
      media_url: null,
      reply_to_id: null,
      message_id: "client-uuid-1",
    };

    it("calls send_message RPC with correct params (MSG-01)", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, message_id: "client-uuid-1" },
        error: null,
      });

      await sendMessage(params, TEST_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("send_message", {
        p_thread_id: TEST_THREAD_ID,
        p_sender_id: TEST_USER_ID,
        p_body: "Hello!",
        p_media_url: null,
        p_reply_to_id: null,
        p_message_id: "client-uuid-1",
      });
    });

    it("returns message_id on success", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, message_id: "client-uuid-1" },
        error: null,
      });

      const result = await sendMessage(params, TEST_USER_ID);

      expect(result.data).toEqual({ message_id: "client-uuid-1" });
      expect(result.error).toBeNull();
    });

    it("returns error when RPC returns blocked error", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { error: "blocked" },
        error: null,
      });

      const result = await sendMessage(params, TEST_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("blocked");
    });

    it("returns error on RPC transport failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      const result = await sendMessage(params, TEST_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Network error");
    });

    it("sends media message with media_url", async () => {
      const mediaParams: SendMessageParams = {
        ...params,
        body: null,
        media_url: "https://example.com/photo.jpg",
      };

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, message_id: "client-uuid-1" },
        error: null,
      });

      await sendMessage(mediaParams, TEST_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("send_message", {
        p_thread_id: TEST_THREAD_ID,
        p_sender_id: TEST_USER_ID,
        p_body: null,
        p_media_url: "https://example.com/photo.jpg",
        p_reply_to_id: null,
        p_message_id: "client-uuid-1",
      });
    });

    it("sends reply message with reply_to_id", async () => {
      const replyParams: SendMessageParams = {
        ...params,
        reply_to_id: "original-msg-id",
      };

      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, message_id: "client-uuid-1" },
        error: null,
      });

      await sendMessage(replyParams, TEST_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("send_message", {
        p_thread_id: TEST_THREAD_ID,
        p_sender_id: TEST_USER_ID,
        p_body: "Hello!",
        p_media_url: null,
        p_reply_to_id: "original-msg-id",
        p_message_id: "client-uuid-1",
      });
    });
  });

  describe("addReaction", () => {
    it("upserts into message_reactions and returns reaction", async () => {
      const reaction = {
        id: "reaction-1",
        message_id: TEST_MESSAGE_ID,
        user_id: TEST_USER_ID,
        emoji: "thumbsup",
        created_at: "2026-03-11T00:00:00Z",
      };
      const chain = createChainMock({ data: reaction, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await addReaction(TEST_MESSAGE_ID, TEST_USER_ID, "thumbsup");

      expect(mockSupabase.from).toHaveBeenCalledWith("message_reactions");
      expect(chain.upsert).toHaveBeenCalledWith(
        {
          message_id: TEST_MESSAGE_ID,
          user_id: TEST_USER_ID,
          emoji: "thumbsup",
        },
        { onConflict: "message_id,user_id" },
      );
      expect(chain.select).toHaveBeenCalled();
      expect(chain.single).toHaveBeenCalled();
      expect(result.data).toEqual(reaction);
      expect(result.error).toBeNull();
    });

    it("returns error on upsert failure", async () => {
      const upsertChain = createChainMock({ data: null, error: { message: "Duplicate" } });
      const lookupChain = createChainMock({ data: null, error: { message: "Lookup failed" } });
      mockSupabase.from
        .mockReturnValueOnce(upsertChain)
        .mockReturnValueOnce(lookupChain);

      const result = await addReaction(TEST_MESSAGE_ID, TEST_USER_ID, "thumbsup");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Duplicate");
    });

    it("falls back to delete+insert when upsert conflict target is unavailable", async () => {
      const upsertErrorChain = createChainMock({
        data: null,
        error: { message: "there is no unique or exclusion constraint matching the ON CONFLICT specification" },
      });
      const existingLookupChain = createChainMock({
        data: { id: "reaction-old", emoji: "heart" },
        error: null,
      });
      const deleteOldChain = createChainMock({ data: null, error: null });
      const insertNewChain = createChainMock({
        data: {
          id: "reaction-new",
          message_id: TEST_MESSAGE_ID,
          user_id: TEST_USER_ID,
          emoji: "laugh",
          created_at: "2026-03-11T00:00:00Z",
        },
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce(upsertErrorChain)
        .mockReturnValueOnce(existingLookupChain)
        .mockReturnValueOnce(deleteOldChain)
        .mockReturnValueOnce(insertNewChain);

      const result = await addReaction(TEST_MESSAGE_ID, TEST_USER_ID, "laugh");

      expect(result.error).toBeNull();
      expect(result.data?.emoji).toBe("laugh");
      expect(deleteOldChain.eq).toHaveBeenCalledWith("id", "reaction-old");
      expect(insertNewChain.insert).toHaveBeenCalledWith({
        message_id: TEST_MESSAGE_ID,
        user_id: TEST_USER_ID,
        emoji: "laugh",
      });
    });
  });

  describe("removeReaction", () => {
    it("deletes from message_reactions by id", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await removeReaction("reaction-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("message_reactions");
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "reaction-1");
      expect(result.error).toBeNull();
    });
  });

  describe("removeReactionForMessageUser", () => {
    it("deletes the current user's reaction by message+user", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await removeReactionForMessageUser(TEST_MESSAGE_ID, TEST_USER_ID);

      expect(result.error).toBeNull();
      expect(chain.eq).toHaveBeenCalledWith("message_id", TEST_MESSAGE_ID);
      expect(chain.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
    });
  });

  describe("updateDeliveryStatus", () => {
    it("updates delivered_at on a message", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await updateDeliveryStatus(TEST_MESSAGE_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("messages");
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", TEST_MESSAGE_ID);
      expect(chain.is).toHaveBeenCalledWith("delivered_at", null);
      expect(result.error).toBeNull();
    });
  });

  describe("deleteMessageForMe", () => {
    it("adds message to local blacklist", async () => {
      const result = await deleteMessageForMe(TEST_MESSAGE_ID, TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
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
    "is", "in", "contains", "overlaps",
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
