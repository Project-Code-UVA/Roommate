CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  liked_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id)
);
CREATE INDEX idx_likes_liked_id ON public.likes(liked_id);
