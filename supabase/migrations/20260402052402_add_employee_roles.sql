ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'collaborator';
