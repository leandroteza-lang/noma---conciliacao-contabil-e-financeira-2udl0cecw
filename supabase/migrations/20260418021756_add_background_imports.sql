-- Create imports bucket if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('imports', 'imports', false) ON CONFLICT DO NOTHING;

-- Storage policies for imports bucket
DROP POLICY IF EXISTS "Users can upload their own imports" ON storage.objects;
CREATE POLICY "Users can upload their own imports" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'imports');

DROP POLICY IF EXISTS "Users can update their own imports" ON storage.objects;
CREATE POLICY "Users can update their own imports" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'imports');

DROP POLICY IF EXISTS "Users can read their own imports" ON storage.objects;
CREATE POLICY "Users can read their own imports" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'imports');

DROP POLICY IF EXISTS "Users can delete their own imports" ON storage.objects;
CREATE POLICY "Users can delete their own imports" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'imports');

-- Alter import_history to support background jobs and polling
ALTER TABLE public.import_history
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS processed_records integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS errors_list jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mode character varying,
ADD COLUMN IF NOT EXISTS sheet_name character varying;
