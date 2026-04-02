ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cpf character varying(20);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone character varying(20);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS observations text;
