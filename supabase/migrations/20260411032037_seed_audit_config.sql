DO $$
BEGIN
  -- Assegura que todas as entidades gerenciadas constam em audit_config para habilitar a leitura na Central de Auditoria
  INSERT INTO public.audit_config (entity_type, retention_days, log_level)
  VALUES 
    ('Usuários', 365, 'DETAILED'),
    ('Contas Bancárias', 365, 'DETAILED'),
    ('Centros de Custo', 365, 'DETAILED'),
    ('Plano de Contas', 365, 'DETAILED'),
    ('Tipos de Conta TGA', 365, 'DETAILED'),
    ('Departamentos', 365, 'DETAILED'),
    ('Empresas', 365, 'DETAILED'),
    ('Mapeamento de Contas', 365, 'DETAILED'),
    ('Movimentações Financeiras', 365, 'DETAILED')
  ON CONFLICT (entity_type) DO NOTHING;
END $$;
