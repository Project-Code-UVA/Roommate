import {
  getConversationPreview,
  getLatestVisibleMessageForUser,
} from "@/services/thread-preview";
import type { Message } from "@/types/chat";

const BASE_MESSAGE: Message = {
  id: "msg-1",
  thread_id: "thread-1",
  sender_id: "user-1",
  body: "Hello",
  media_url: null,
  reply_to_id: null,
  unsent_at: null,
  deleted_for_everyone_at: null,
  deleted_at: null,
  delivered_at: null,
  read_at: null,
  edited_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  _status: "sent",
  reply_to: null,
};

function makeMessage(overrides: Partial<Message>): Message {
  return { ...BASE_MESSAGE, ...overrides };
}

describe("thread-preview", () => {
  describe("getLatestVisibleMessageForUser", () => {
    it("keeps latest visible event even when it is unsent placeholder", () => {
      const olderText = makeMessage({
        id: "msg-text",
        sender_id: "user-1",
        body: "Older text",
        created_at: "2026-01-01T00:00:00.000Z",
      });
      const newerUnsent = makeMessage({
        id: "msg-unsent",
        sender_id: "user-1",
        body: null,
        unsent_at: "2026-01-01T00:02:00.000Z",
        created_at: "2026-01-01T00:02:00.000Z",
      });

      const latest = getLatestVisibleMessageForUser(
        [olderText, newerUnsent],
        "user-1",
      );

      expect(latest?.id).toBe("msg-unsent");
    });
  });

  describe("getConversationPreview", () => {
    it("shows unsent placeholder when latest event is unsent", () => {
      const unsentMessage = makeMessage({
        sender_id: "user-1",
        body: null,
        unsent_at: "2026-01-01T00:02:00.000Z",
      });

      expect(
        getConversationPreview(unsentMessage, "user-1", {
          senderName: "Alex",
        }),
      ).toBe("You unsent a message");
    });

    it("shows deleted placeholder when latest event is delete-for-everyone", () => {
      const deletedMessage = makeMessage({
        sender_id: "user-2",
        body: null,
        deleted_for_everyone_at: "2026-01-01T00:03:00.000Z",
      });

      expect(
        getConversationPreview(deletedMessage, "user-1", {
          senderName: "Alex",
        }),
      ).toBe("Message deleted");
    });
  });
});
