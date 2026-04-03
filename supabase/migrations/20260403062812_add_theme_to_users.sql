ALTER TABLE public.cadastro_usuarios ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'system';
ALTER TABLE public.cadastro_usuarios ADD COLUMN IF NOT EXISTS color_theme text DEFAULT 'default';
