-- Migration: Create v2 message action functions with text parameters
-- This bypasses potential PostgREST schema cache issues with previous names.

-- Edit message V2
CREATE OR REPLACE FUNCTION public.edit_message_v2(p_message_id text, p_body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_msg_id uuid;
BEGIN
  v_msg_id := p_message_id::uuid;

  -- Get sender
  SELECT sender_id INTO v_sender_id FROM messages WHERE id = v_msg_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'message_not_found');
  END IF;
  
  -- Verify ownership
  IF v_sender_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;
  
  -- Update message
  UPDATE messages
  SET body = p_body, edited_at = now()
  WHERE id = v_msg_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Unsend message V2
CREATE OR REPLACE FUNCTION public.unsend_message_v2(p_message_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_created_at timestamptz;
  v_msg_id uuid;
BEGIN
  v_msg_id := p_message_id::uuid;

  -- Get message info
  SELECT sender_id, created_at INTO v_sender_id, v_created_at 
  FROM messages 
  WHERE id = v_msg_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'message_not_found');
  END IF;
  
  -- Verify ownership
  IF v_sender_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;
  
  -- Verify time limit (5 minutes)
  IF v_created_at < now() - interval '5 minutes' THEN
    RETURN jsonb_build_object('error', 'time_limit_exceeded');
  END IF;
  
  -- Keep placeholder state
  UPDATE messages
  SET
    body = null,
    media_url = null,
    reply_to_id = null,
    unsent_at = now(),
    edited_at = null
  WHERE id = v_msg_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Delete for everyone V2
CREATE OR REPLACE FUNCTION public.delete_message_for_everyone_v2(p_message_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_msg_id uuid;
BEGIN
  v_msg_id := p_message_id::uuid;

  SELECT sender_id INTO v_sender_id FROM messages WHERE id = v_msg_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'message_not_found');
  END IF;

  IF v_sender_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;

  UPDATE messages
  SET
    body = null,
    media_url = null,
    reply_to_id = null,
    deleted_for_everyone_at = now(),
    edited_at = null
  WHERE id = v_msg_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
