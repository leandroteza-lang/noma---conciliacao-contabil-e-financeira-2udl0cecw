CREATE SEQUENCE IF NOT EXISTS public.tipo_conta_tga_codigo_seq;

ALTER TABLE public.tipo_conta_tga ALTER COLUMN codigo SET DEFAULT nextval('public.tipo_conta_tga_codigo_seq')::VARCHAR;

DO $$
DECLARE
  max_val INT;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '\D', '', 'g'), '')::INT), 0) 
  INTO max_val 
  FROM public.tipo_conta_tga;
  
  PERFORM setval('public.tipo_conta_tga_codigo_seq', max_val + 1, false);
END $$;
