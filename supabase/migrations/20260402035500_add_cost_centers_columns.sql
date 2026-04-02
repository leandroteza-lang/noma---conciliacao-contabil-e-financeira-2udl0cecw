ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS type_tga VARCHAR;
ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS fixed_variable VARCHAR;
ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS classification VARCHAR;
ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS operational VARCHAR;
