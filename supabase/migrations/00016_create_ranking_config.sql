CREATE TABLE public.ranking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_name text NOT NULL UNIQUE,
  weight_value numeric(5,4) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
