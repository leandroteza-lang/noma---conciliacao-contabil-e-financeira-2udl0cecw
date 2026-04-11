-- PROBLEMA 3 (Ausência na configuração de visualização): O filtro da página de Central de Auditoria 
-- consome as chaves cadastradas na 'audit_config'. Se a entidade não estiver listada lá, 
-- ela não aparecerá no filtro do painel, criando o "ponto cego".
-- SOLUÇÃO: Garantimos que 'Contas Bancárias' esteja formalmente inserido na tabela de configurações de auditoria.

INSERT INTO public.audit_config (entity_type, retention_days, log_level)
VALUES ('Contas Bancárias', 365, 'DETAILED')
ON CONFLICT (entity_type) DO NOTHING;

INSERT INTO public.audit_config (entity_type, retention_days, log_level)
VALUES ('Departamentos', 365, 'DETAILED')
ON CONFLICT (entity_type) DO NOTHING;
