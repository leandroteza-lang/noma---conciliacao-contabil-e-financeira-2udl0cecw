-- Garante que as politicas de exclusao em lote funcionem perfeitamente
DROP POLICY IF EXISTS "Allow authenticated users to delete audit logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated users to delete audit logs" ON public.audit_logs
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete audit details" ON public.audit_details;
CREATE POLICY "Allow authenticated users to delete audit details" ON public.audit_details
  FOR DELETE TO authenticated USING (true);
