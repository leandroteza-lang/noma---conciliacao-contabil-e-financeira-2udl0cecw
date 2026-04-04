CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view audit logs" ON audit_logs;
CREATE POLICY "Allow authenticated users to view audit logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to insert audit logs" ON audit_logs;
CREATE POLICY "Allow service role to insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS audit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id UUID REFERENCES audit_logs(id) ON DELETE CASCADE NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view audit details" ON audit_details;
CREATE POLICY "Allow authenticated users to view audit details" ON audit_details
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to insert audit details" ON audit_details;
CREATE POLICY "Allow service role to insert audit details" ON audit_details
    FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS audit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) UNIQUE NOT NULL,
    retention_days INT DEFAULT 365 NOT NULL,
    log_level VARCHAR(20) DEFAULT 'DETAILED' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE audit_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view audit config" ON audit_config;
CREATE POLICY "Allow authenticated users to view audit config" ON audit_config
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to update audit config" ON audit_config;
CREATE POLICY "Allow service role to update audit config" ON audit_config
    FOR UPDATE USING (true);

INSERT INTO audit_config (entity_type, retention_days, log_level) VALUES
('usuario', 365, 'DETAILED'),
('empresa', 365, 'DETAILED'),
('departamento', 365, 'DETAILED')
ON CONFLICT (entity_type) DO NOTHING;
