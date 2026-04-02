CREATE TABLE IF NOT EXISTS public.import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    import_type VARCHAR NOT NULL,
    file_name VARCHAR,
    total_records INT DEFAULT 0,
    success_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    status VARCHAR DEFAULT 'Completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "user_import_history_select" ON public.import_history;
CREATE POLICY "user_import_history_select" ON public.import_history FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_import_history_insert" ON public.import_history;
CREATE POLICY "user_import_history_insert" ON public.import_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_import_history_delete" ON public.import_history;
CREATE POLICY "user_import_history_delete" ON public.import_history FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
