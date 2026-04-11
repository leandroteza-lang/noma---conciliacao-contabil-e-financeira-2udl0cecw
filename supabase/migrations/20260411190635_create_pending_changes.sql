CREATE TABLE IF NOT EXISTS public.pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  proposed_changes JSONB NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "authenticated_pending_changes_select" ON public.pending_changes;
CREATE POLICY "authenticated_pending_changes_select" ON public.pending_changes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_pending_changes_insert" ON public.pending_changes;
CREATE POLICY "authenticated_pending_changes_insert" ON public.pending_changes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_pending_changes_update" ON public.pending_changes;
CREATE POLICY "authenticated_pending_changes_update" ON public.pending_changes
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_pending_changes_delete" ON public.pending_changes;
CREATE POLICY "authenticated_pending_changes_delete" ON public.pending_changes
  FOR DELETE TO authenticated USING (true);

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;
