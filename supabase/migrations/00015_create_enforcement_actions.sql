CREATE TABLE public.enforcement_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action enforcement_action_type NOT NULL,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_enforcement_user_id ON public.enforcement_actions(user_id);
