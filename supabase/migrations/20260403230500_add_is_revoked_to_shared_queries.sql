ALTER TABLE public.shared_queries ADD COLUMN IF NOT EXISTS is_revoked boolean DEFAULT false;
