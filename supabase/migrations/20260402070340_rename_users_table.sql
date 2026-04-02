DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    ALTER TABLE employees RENAME TO cadastro_usuarios;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_companies') THEN
    ALTER TABLE employee_companies RENAME TO cadastro_usuarios_companies;
  END IF;
END $;

DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cadastro_usuarios_companies' AND column_name = 'employee_id') THEN
    ALTER TABLE public.cadastro_usuarios_companies RENAME COLUMN employee_id TO usuario_id;
  END IF;
END $;

ALTER TABLE public.cadastro_usuarios ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.cadastro_usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
