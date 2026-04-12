DO $DO$
DECLARE
  t text;
  tables text[] := ARRAY[
    'organizations', 
    'departments', 
    'cost_centers', 
    'chart_of_accounts', 
    'bank_accounts', 
    'tipo_conta_tga', 
    'cadastro_usuarios',
    'pending_changes'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Enforce REPLICA IDENTITY FULL so UPDATE events carry the full payload, 
    -- allowing realtime triggers on state changes like pending_deletion.
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', t);
    
    -- Ensure the table is properly published to the realtime engine
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $DO$;
