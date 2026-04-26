-- Add edited_at column
ALTER TABLE public.messages ADD COLUMN edited_at timestamptz;
ALTER TABLE public.messages ADD COLUMN unsent_at timestamptz;
ALTER TABLE public.messages ADD COLUMN deleted_for_everyone_at timestamptz;

-- Edit message RPC
CREATE OR REPLACE FUNCTION public.edit_message(p_message_id uuid, p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid;
BEGIN
  -- Get sender
  SELECT sender_id INTO v_sender_id FROM public.messages WHERE id = p_message_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Verify ownership
  IF v_sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to edit this message';
  END IF;
  
  -- Update message
  UPDATE public.messages
  SET body = p_body, edited_at = now()
  WHERE id = p_message_id;
END;
$$;

-- Unsend message RPC
CREATE OR REPLACE FUNCTION public.unsend_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid;
  v_created_at timestamptz;
BEGIN
  -- Get message info
  SELECT sender_id, created_at INTO v_sender_id, v_created_at 
  FROM public.messages 
  WHERE id = p_message_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Verify ownership
  IF v_sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to unsend this message';
  END IF;
  
  -- Verify time limit (5 minutes)
  IF v_created_at < now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'Cannot unsend messages older than 5 minutes';
  END IF;
  
  -- Keep placeholder state for all users instead of deleting the row.
  UPDATE public.messages
  SET
    body = null,
    media_url = null,
    reply_to_id = null,
    unsent_at = now(),
    edited_at = null
  WHERE id = p_message_id;
END;
$$;

-- Delete for everyone RPC
CREATE OR REPLACE FUNCTION public.delete_message_for_everyone(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid;
BEGIN
  SELECT sender_id INTO v_sender_id FROM public.messages WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF v_sender_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to delete this message for everyone';
  END IF;

  UPDATE public.messages
  SET
    body = null,
    media_url = null,
    reply_to_id = null,
    deleted_for_everyone_at = now(),
    edited_at = null
  WHERE id = p_message_id;
END;
$$;
