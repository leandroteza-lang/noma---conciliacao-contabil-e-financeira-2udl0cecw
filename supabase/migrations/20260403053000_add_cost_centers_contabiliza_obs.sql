DO $$
BEGIN
  ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS contabiliza VARCHAR(3);
  ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS observacoes TEXT;
END $$;
