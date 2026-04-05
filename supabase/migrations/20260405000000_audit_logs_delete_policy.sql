DROP POLICY IF EXISTS "Allow authenticated users to delete audit logs" ON audit_logs;
CREATE POLICY "Allow authenticated users to delete audit logs" ON audit_logs
    FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete audit details" ON audit_details;
CREATE POLICY "Allow authenticated users to delete audit details" ON audit_details
    FOR DELETE TO authenticated USING (true);
