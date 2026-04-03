DO $$
BEGIN
  ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS tipo_lcto VARCHAR(1);
  ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS tipo_tga_id UUID REFERENCES public.tipo_conta_tga(id) ON DELETE SET NULL;
END $$;
