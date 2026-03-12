/**
 * Tests for message-service.
 * Covers: MSG-01, MSG-04, MSG-10
 */

// import { sendMessage, addReaction, removeReaction, updateDeliveryStatus } from "@/services/message-service";

describe("message-service", () => {
  describe("sendMessage", () => {
    it.todo("sends text message via send_message RPC");
    it.todo("returns error when thread not active");
    it.todo("returns error when blocked");
    it.todo("returns error when no shared school");
    it.todo("returns error when under enforcement");
    it.todo("sends media message");
    it.todo("sends reply message with reply_to_id");
  });

  describe("reactions", () => {
    it.todo("adds reaction to a message");
    it.todo("removes reaction from a message");
  });

  describe("delivery", () => {
    it.todo("updates delivery status on message");
  });
});
