DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'accounting_entries' 
    AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE public.accounting_entries ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL;
  END IF;
END $;
