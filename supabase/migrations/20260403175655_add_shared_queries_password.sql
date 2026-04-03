ALTER TABLE public.shared_queries ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT false;
ALTER TABLE public.shared_queries ADD COLUMN IF NOT EXISTS password TEXT;
