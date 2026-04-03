-- Add access_count column
ALTER TABLE public.shared_queries ADD COLUMN IF NOT EXISTS access_count integer NOT NULL DEFAULT 0;

-- Drop existing if we want to replace or just add new
DROP POLICY IF EXISTS "Users can update their own shared queries" ON public.shared_queries;
CREATE POLICY "Users can update their own shared queries" ON public.shared_queries
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own shared queries" ON public.shared_queries;
CREATE POLICY "Users can delete their own shared queries" ON public.shared_queries
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Function to increment access count safely
CREATE OR REPLACE FUNCTION public.increment_shared_query_access(query_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_queries
  SET access_count = access_count + 1
  WHERE id = query_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
