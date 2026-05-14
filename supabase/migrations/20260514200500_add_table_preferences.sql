ALTER TABLE public.cadastro_usuarios ADD COLUMN IF NOT EXISTS table_preferences JSONB DEFAULT '{}'::jsonb;
