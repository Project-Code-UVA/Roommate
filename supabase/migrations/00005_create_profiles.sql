CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  bio text,
  year text,
  hometown text,
  nitty_gritty jsonb DEFAULT '{}'::jsonb,
  completion_score smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
