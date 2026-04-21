DO $do$
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
    'account_mapping',
    'pending_changes',
    'shared_queries'
  ];
BEGIN
  -- Cria a publicação do Realtime caso não exista
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Adiciona as tabelas necessárias à publicação se ainda não estiverem
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $do$;
