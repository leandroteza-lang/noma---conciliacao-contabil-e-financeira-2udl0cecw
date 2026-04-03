CREATE TABLE IF NOT EXISTS public.tipo_conta_tga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  codigo VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  abreviacao CHAR(1),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pending_deletion BOOLEAN DEFAULT FALSE,
  deletion_requested_at TIMESTAMPTZ,
  deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.tipo_conta_tga ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_tipo_conta_tga_select" ON public.tipo_conta_tga;
CREATE POLICY "org_tipo_conta_tga_select" ON public.tipo_conta_tga
  FOR SELECT TO authenticated USING (
    (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())) OR
    (organization_id IN (SELECT cuc.organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email::text = auth.jwt() ->> 'email'::text))
  );

DROP POLICY IF EXISTS "org_tipo_conta_tga_insert" ON public.tipo_conta_tga;
CREATE POLICY "org_tipo_conta_tga_insert" ON public.tipo_conta_tga
  FOR INSERT TO authenticated WITH CHECK (
    (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())) OR
    (organization_id IN (SELECT cuc.organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email::text = auth.jwt() ->> 'email'::text))
  );

DROP POLICY IF EXISTS "org_tipo_conta_tga_update" ON public.tipo_conta_tga;
CREATE POLICY "org_tipo_conta_tga_update" ON public.tipo_conta_tga
  FOR UPDATE TO authenticated USING (
    (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())) OR
    (organization_id IN (SELECT cuc.organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email::text = auth.jwt() ->> 'email'::text))
  );

DROP POLICY IF EXISTS "org_tipo_conta_tga_delete" ON public.tipo_conta_tga;
CREATE POLICY "org_tipo_conta_tga_delete" ON public.tipo_conta_tga
  FOR DELETE TO authenticated USING (
    (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())) OR
    (organization_id IN (SELECT cuc.organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email::text = auth.jwt() ->> 'email'::text))
  );
