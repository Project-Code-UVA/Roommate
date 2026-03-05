CREATE TABLE public.dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dismisser_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dismissed_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dismisser_id, dismissed_id)
);
