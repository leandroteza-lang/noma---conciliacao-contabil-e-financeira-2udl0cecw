DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organizations' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'departments' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cost_centers' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_centers;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'chart_of_accounts' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bank_accounts' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tipo_conta_tga' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tipo_conta_tga;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cadastro_usuarios' AND schemaname = 'public') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cadastro_usuarios;
  END IF;
END $$;
