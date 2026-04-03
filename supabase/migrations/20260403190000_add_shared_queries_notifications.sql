ALTER TABLE public.shared_queries 
  ADD COLUMN IF NOT EXISTS notify_first_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_access_notified BOOLEAN DEFAULT false;

-- Create or Replace function to handle increment and notification flag
CREATE OR REPLACE FUNCTION public.increment_shared_query_access(query_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.shared_queries
  SET 
    access_count = access_count + 1,
    first_access_notified = CASE 
      WHEN notify_first_access = true AND first_access_notified = false THEN true 
      ELSE first_access_notified 
    END
  WHERE id = query_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for shared_queries if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shared_queries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_queries;
  END IF;
END $$;
