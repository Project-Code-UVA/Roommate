-- Migration: Add reply_to_id for message threading (MSG-05)
ALTER TABLE public.messages
  ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX idx_messages_reply_to ON public.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;
