CREATE TABLE IF NOT EXISTS public.chart_of_accounts_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    backup_date TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL
);

ALTER TABLE public.chart_of_accounts_backup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_chart_of_accounts_backup_select" ON public.chart_of_accounts_backup;
CREATE POLICY "org_chart_of_accounts_backup_select" ON public.chart_of_accounts_backup
    FOR SELECT TO authenticated
    USING (
        organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
        organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "org_chart_of_accounts_backup_insert" ON public.chart_of_accounts_backup;
CREATE POLICY "org_chart_of_accounts_backup_insert" ON public.chart_of_accounts_backup
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()) OR
        organization_id IN (SELECT organization_id FROM public.cadastro_usuarios_companies cuc JOIN public.cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = auth.jwt()->>'email')
    );
