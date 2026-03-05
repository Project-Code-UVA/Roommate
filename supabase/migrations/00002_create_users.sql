CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  birthdate date NOT NULL,
  selfie_verified boolean NOT NULL DEFAULT false,
  mode_status mode_status NOT NULL DEFAULT 'roommate',
  enforcement_state enforcement_state NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);
