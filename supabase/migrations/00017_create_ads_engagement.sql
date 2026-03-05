CREATE TABLE public.ads_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  swipe_count integer NOT NULL DEFAULT 0,
  first_match_at timestamptz,
  ads_eligible boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
