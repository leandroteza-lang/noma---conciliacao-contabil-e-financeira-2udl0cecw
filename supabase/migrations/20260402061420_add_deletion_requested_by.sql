DO $
BEGIN
  ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
END $;
