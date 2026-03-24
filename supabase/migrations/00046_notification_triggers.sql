-- Migration: Notification triggers for matches and messages.
-- These triggers fire webhooks that invoke the send-push-notification Edge Function.

-- Trigger function for new matches
CREATE OR REPLACE FUNCTION notify_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify both users in the match
  PERFORM pg_notify('push_notification', jsonb_build_object(
    'type', 'match',
    'user_a_id', NEW.user_a_id,
    'user_b_id', NEW.user_b_id,
    'match_id', NEW.id
  )::text);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_match
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_match();

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thread record;
  v_recipient_id uuid;
BEGIN
  -- Find the thread to determine the recipient
  SELECT user_a_id, user_b_id INTO v_thread
  FROM threads WHERE id = NEW.thread_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Recipient is the other user in the thread
  IF v_thread.user_a_id = NEW.sender_id THEN
    v_recipient_id := v_thread.user_b_id;
  ELSE
    v_recipient_id := v_thread.user_a_id;
  END IF;

  PERFORM pg_notify('push_notification', jsonb_build_object(
    'type', 'message',
    'recipient_id', v_recipient_id,
    'sender_id', NEW.sender_id,
    'thread_id', NEW.thread_id,
    'message_preview', left(NEW.body, 100)
  )::text);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();
