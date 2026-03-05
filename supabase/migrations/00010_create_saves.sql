CREATE TABLE public.saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  saved_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saver_id, saved_id)
);
