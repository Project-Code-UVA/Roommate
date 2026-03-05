CREATE TABLE public.user_schools (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, school_id)
);
CREATE INDEX idx_user_schools_school_id ON public.user_schools(school_id);
