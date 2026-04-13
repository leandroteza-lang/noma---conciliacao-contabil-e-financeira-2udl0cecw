CREATE TABLE IF NOT EXISTS public.cost_centers_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_date timestamptz DEFAULT now(),
  data jsonb NOT NULL
);

ALTER TABLE public.cost_centers_backup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_cost_centers_backup_insert" ON public.cost_centers_backup;
CREATE POLICY "org_cost_centers_backup_insert" ON public.cost_centers_backup
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies WHERE usuario_id IN (SELECT id FROM public.cadastro_usuarios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "org_cost_centers_backup_select" ON public.cost_centers_backup;
CREATE POLICY "org_cost_centers_backup_select" ON public.cost_centers_backup
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies WHERE usuario_id IN (SELECT id FROM public.cadastro_usuarios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
  );

DROP POLICY IF EXISTS "org_cost_centers_backup_delete" ON public.cost_centers_backup;
CREATE POLICY "org_cost_centers_backup_delete" ON public.cost_centers_backup
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies WHERE usuario_id IN (SELECT id FROM public.cadastro_usuarios WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
  );
