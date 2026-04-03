DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['bank_accounts', 'cost_centers', 'chart_of_accounts', 'account_mapping', 'financial_movements', 'accounting_entries']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "org_%s_select" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_select" ON public.%I FOR SELECT TO authenticated USING (
      organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
      organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = (auth.jwt() ->> ''email''))
    )', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "org_%s_insert" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (
      organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
      organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = (auth.jwt() ->> ''email''))
    )', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "org_%s_update" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_update" ON public.%I FOR UPDATE TO authenticated USING (
      organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
      organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = (auth.jwt() ->> ''email''))
    )', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "org_%s_delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_delete" ON public.%I FOR DELETE TO authenticated USING (
      organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
      organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = (auth.jwt() ->> ''email''))
    )', t, t);
  END LOOP;
END $$;
