ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT false;
ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE public.cost_centers ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT false;
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE public.chart_of_accounts ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT false;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
