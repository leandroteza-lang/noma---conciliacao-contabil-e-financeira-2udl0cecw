DO $$
BEGIN
  -- Normalize audit_config
  UPDATE public.audit_config SET entity_type = 'Usuários' WHERE entity_type IN ('usuario', 'cadastro_usuarios', 'usuarios');
  UPDATE public.audit_config SET entity_type = 'Contas Bancárias' WHERE entity_type IN ('bank_accounts', 'conta_bancaria', 'contas_bancarias', 'listagem de contas');
  UPDATE public.audit_config SET entity_type = 'Centros de Custo' WHERE entity_type IN ('cost_centers', 'centro_custo', 'centros_de_custo', 'centros de custo');
  UPDATE public.audit_config SET entity_type = 'Plano de Contas' WHERE entity_type IN ('chart_of_accounts', 'conta_contabil', 'plano_de_contas', 'plano de contas');
  UPDATE public.audit_config SET entity_type = 'Tipos de Conta TGA' WHERE entity_type IN ('tipo_conta_tga', 'tga_account_types', 'tipos de conta tga');
  UPDATE public.audit_config SET entity_type = 'Departamentos' WHERE entity_type IN ('departments', 'departamento', 'departamentos');
  UPDATE public.audit_config SET entity_type = 'Empresas' WHERE entity_type IN ('organizations', 'empresa', 'empresas');

  -- Normalize audit_logs
  UPDATE public.audit_logs SET entity_type = 'Usuários' WHERE entity_type IN ('usuario', 'cadastro_usuarios', 'usuarios');
  UPDATE public.audit_logs SET entity_type = 'Contas Bancárias' WHERE entity_type IN ('bank_accounts', 'conta_bancaria', 'contas_bancarias', 'listagem de contas');
  UPDATE public.audit_logs SET entity_type = 'Centros de Custo' WHERE entity_type IN ('cost_centers', 'centro_custo', 'centros_de_custo', 'centros de custo');
  UPDATE public.audit_logs SET entity_type = 'Plano de Contas' WHERE entity_type IN ('chart_of_accounts', 'conta_contabil', 'plano_de_contas', 'plano de contas');
  UPDATE public.audit_logs SET entity_type = 'Tipos de Conta TGA' WHERE entity_type IN ('tipo_conta_tga', 'tga_account_types', 'tipos de conta tga');
  UPDATE public.audit_logs SET entity_type = 'Departamentos' WHERE entity_type IN ('departments', 'departamento', 'departamentos');
  UPDATE public.audit_logs SET entity_type = 'Empresas' WHERE entity_type IN ('organizations', 'empresa', 'empresas');
END $$;
