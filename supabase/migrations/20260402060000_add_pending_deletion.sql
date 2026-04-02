DO $
BEGIN
  -- Add pending_deletion columns to support soft deletes and approval workflow
  ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

  ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

  ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
END $;
