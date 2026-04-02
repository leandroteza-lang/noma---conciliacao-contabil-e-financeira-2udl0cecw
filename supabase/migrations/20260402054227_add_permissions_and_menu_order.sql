ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["all"]'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS menu_order JSONB DEFAULT '[]'::jsonb;
