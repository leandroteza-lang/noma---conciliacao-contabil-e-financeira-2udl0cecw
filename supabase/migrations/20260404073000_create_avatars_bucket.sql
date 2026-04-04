DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true) 
  ON CONFLICT (id) DO UPDATE SET public = true;

  DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
  CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

  DROP POLICY IF EXISTS "Avatar Auth Insert" ON storage.objects;
  CREATE POLICY "Avatar Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

  DROP POLICY IF EXISTS "Avatar Auth Update" ON storage.objects;
  CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

  DROP POLICY IF EXISTS "Avatar Auth Delete" ON storage.objects;
  CREATE POLICY "Avatar Auth Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
END $$;
