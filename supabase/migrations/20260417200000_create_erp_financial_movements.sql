CREATE TABLE IF NOT EXISTS public.erp_financial_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  compensado TEXT,
  tipo_operacao TEXT,
  data_emissao DATE,
  dt_compens DATE,
  conta_caixa TEXT,
  nome_caixa TEXT,
  conta_caixa_destino TEXT,
  forma_pagto TEXT,
  c_custo TEXT,
  descricao_c_custo TEXT,
  valor NUMERIC,
  valor_liquido NUMERIC,
  n_documento TEXT,
  nome_cli_fornec TEXT,
  historico TEXT,
  fp TEXT,
  n_cheque TEXT,
  data_vencto DATE,
  nominal_a TEXT,
  emitente_cheque TEXT,
  cnpj_cpf TEXT,
  n_extrato TEXT,
  filial TEXT,
  data_canc DATE,
  data_estorno DATE,
  banco TEXT,
  c_corrente TEXT,
  cod_cli_for TEXT,
  departamento TEXT,
  
  mapped_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Pendente',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pending_deletion BOOLEAN DEFAULT false,
  deletion_requested_at TIMESTAMPTZ,
  deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.erp_financial_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_erp_financial_movements_select" ON public.erp_financial_movements;
CREATE POLICY "org_erp_financial_movements_select" ON public.erp_financial_movements
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM cadastro_usuarios_companies cuc JOIN cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "org_erp_financial_movements_insert" ON public.erp_financial_movements;
CREATE POLICY "org_erp_financial_movements_insert" ON public.erp_financial_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM cadastro_usuarios_companies cuc JOIN cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "org_erp_financial_movements_update" ON public.erp_financial_movements;
CREATE POLICY "org_erp_financial_movements_update" ON public.erp_financial_movements
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM cadastro_usuarios_companies cuc JOIN cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = auth.jwt()->>'email')
  );

DROP POLICY IF EXISTS "org_erp_financial_movements_delete" ON public.erp_financial_movements;
CREATE POLICY "org_erp_financial_movements_delete" ON public.erp_financial_movements
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()) OR
    organization_id IN (SELECT organization_id FROM cadastro_usuarios_companies cuc JOIN cadastro_usuarios cu ON cuc.usuario_id = cu.id WHERE cu.email = auth.jwt()->>'email')
  );

CREATE OR REPLACE FUNCTION public.audit_table_update_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_key text;
  v_old_val text;
  v_new_val text;
  v_audit_id uuid;
  v_entity_type text;
  v_user_id uuid;
  v_action text;
  v_ignored_cols text[] := ARRAY['created_at', 'updated_at', 'deleted_at', 'deleted_by', 'deletion_requested_at', 'deletion_requested_by', 'pending_deletion', 'id', 'organization_id', 'user_id', 'password', 'encrypted_password'];
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'cadastro_usuarios' THEN v_entity_type := 'Usuários';
    WHEN 'bank_accounts' THEN v_entity_type := 'Contas Bancárias';
    WHEN 'cost_centers' THEN v_entity_type := 'Centros de Custo';
    WHEN 'chart_of_accounts' THEN v_entity_type := 'Plano de Contas';
    WHEN 'tipo_conta_tga' THEN v_entity_type := 'Tipos de Conta TGA';
    WHEN 'departments' THEN v_entity_type := 'Departamentos';
    WHEN 'organizations' THEN v_entity_type := 'Empresas';
    WHEN 'account_mapping' THEN v_entity_type := 'Mapeamento de Contas';
    WHEN 'financial_movements' THEN v_entity_type := 'Movimentações Financeiras';
    WHEN 'erp_financial_movements' THEN v_entity_type := 'Movimento Financeiro TGA';
    ELSE v_entity_type := TG_TABLE_NAME;
  END CASE;

  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    FOR v_key IN SELECT key FROM jsonb_each(v_new)
    LOOP
      IF v_key = ANY(v_ignored_cols) THEN CONTINUE; END IF;
      v_new_val := trim(COALESCE(v_new->>v_key, ''));
      IF v_new_val != '' THEN
        v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('new', v_new_val));
      END IF;
    END LOOP;

    IF v_changes != '{}'::jsonb THEN
      INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
      VALUES (v_entity_type, NEW.id, 'CREATE', v_user_id, v_changes)
      RETURNING id INTO v_audit_id;
      
      FOR v_key IN SELECT key FROM jsonb_each(v_changes)
      LOOP
        INSERT INTO public.audit_details (audit_log_id, field_name, new_value)
        VALUES (v_audit_id, v_key, v_changes->v_key->>'new');
      END LOOP;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_action := 'UPDATE';

    IF (v_new->>'deleted_at') IS NOT NULL AND (v_old->>'deleted_at') IS NULL THEN
      v_action := 'DELETE';
    END IF;
    
    FOR v_key IN SELECT key FROM jsonb_each(v_old)
    LOOP
      IF v_key = ANY(v_ignored_cols) THEN CONTINUE; END IF;
      v_old_val := trim(COALESCE(v_old->>v_key, ''));
      v_new_val := trim(COALESCE(v_new->>v_key, ''));
      
      IF v_old_val IS DISTINCT FROM v_new_val THEN
        v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('old', v_old_val, 'new', v_new_val));
      END IF;
    END LOOP;
    
    IF v_changes != '{}'::jsonb OR v_action = 'DELETE' THEN
      INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
      VALUES (v_entity_type, NEW.id, v_action, v_user_id, CASE WHEN v_changes = '{}'::jsonb THEN NULL ELSE v_changes END)
      RETURNING id INTO v_audit_id;
      
      IF v_changes != '{}'::jsonb THEN
        FOR v_key IN SELECT key FROM jsonb_each(v_changes)
        LOOP
          INSERT INTO public.audit_details (audit_log_id, field_name, old_value, new_value)
          VALUES (v_audit_id, v_key, v_changes->v_key->>'old', v_changes->v_key->>'new');
        END LOOP;
      END IF;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    FOR v_key IN SELECT key FROM jsonb_each(v_old)
    LOOP
      IF v_key = ANY(v_ignored_cols) THEN CONTINUE; END IF;
      v_old_val := trim(COALESCE(v_old->>v_key, ''));
      IF v_old_val != '' THEN
        v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('old', v_old_val));
      END IF;
    END LOOP;

    INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
    VALUES (v_entity_type, OLD.id, 'DELETE', v_user_id, CASE WHEN v_changes = '{}'::jsonb THEN NULL ELSE v_changes END)
    RETURNING id INTO v_audit_id;
    
    IF v_changes != '{}'::jsonb THEN
      FOR v_key IN SELECT key FROM jsonb_each(v_changes)
      LOOP
        INSERT INTO public.audit_details (audit_log_id, field_name, old_value)
        VALUES (v_audit_id, v_key, v_changes->v_key->>'old');
      END LOOP;
    END IF;

    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_erp_financial_movements ON public.erp_financial_movements;
CREATE TRIGGER trg_audit_erp_financial_movements
  AFTER INSERT OR UPDATE OR DELETE ON public.erp_financial_movements
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();
