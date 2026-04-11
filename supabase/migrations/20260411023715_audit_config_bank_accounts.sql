INSERT INTO audit_config (entity_type, retention_days, log_level) VALUES
('Contas Bancárias', 365, 'DETAILED'),
('bank_accounts', 365, 'DETAILED')
ON CONFLICT (entity_type) DO NOTHING;
