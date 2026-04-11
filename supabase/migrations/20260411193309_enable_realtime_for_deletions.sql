DO $$
BEGIN
  -- Enable realtime for bank_accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bank_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
  END IF;

  -- Enable realtime for organizations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'organizations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
  END IF;

  -- Enable realtime for departments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'departments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
  END IF;

  -- Enable realtime for cost_centers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cost_centers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_centers;
  END IF;

  -- Enable realtime for chart_of_accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chart_of_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;
  END IF;

  -- Enable realtime for tipo_conta_tga
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tipo_conta_tga'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tipo_conta_tga;
  END IF;
  
  -- Enable realtime for cadastro_usuarios
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cadastro_usuarios'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cadastro_usuarios;
  END IF;
END $$;
