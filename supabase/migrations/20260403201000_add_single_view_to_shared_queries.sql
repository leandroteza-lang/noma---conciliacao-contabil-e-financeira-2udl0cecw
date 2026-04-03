ALTER TABLE public.shared_queries 
  ADD COLUMN IF NOT EXISTS single_view BOOLEAN DEFAULT false;
