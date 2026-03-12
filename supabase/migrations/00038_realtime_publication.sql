-- Migration: Enable Realtime for messages and message_reactions (MSG-01)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
