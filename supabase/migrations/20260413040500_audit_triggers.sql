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
    ELSE v_entity_type := TG_TABLE_NAME;
  END CASE;

  v_user_id := auth.uid();

  IF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    
    FOR v_key IN SELECT key FROM jsonb_each(v_old)
    LOOP
      IF v_key = ANY(v_ignored_cols) THEN
        CONTINUE;
      END IF;
      
      v_old_val := trim(COALESCE(v_old->>v_key, ''));
      v_new_val := trim(COALESCE(v_new->>v_key, ''));
      
      IF v_old_val IS DISTINCT FROM v_new_val THEN
        v_changes := jsonb_set(v_changes, ARRAY[v_key], jsonb_build_object('old', v_old_val, 'new', v_new_val));
      END IF;
    END LOOP;
    
    IF v_changes != '{}'::jsonb THEN
      INSERT INTO public.audit_logs (entity_type, entity_id, action, performed_by, changes)
      VALUES (v_entity_type, NEW.id, 'UPDATE', v_user_id, v_changes)
      RETURNING id INTO v_audit_id;
      
      FOR v_key IN SELECT key FROM jsonb_each(v_changes)
      LOOP
        INSERT INTO public.audit_details (audit_log_id, field_name, old_value, new_value)
        VALUES (v_audit_id, v_key, v_changes->v_key->>'old', v_changes->v_key->>'new');
      END LOOP;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_audit_cost_centers_update ON public.cost_centers;
CREATE TRIGGER trg_audit_cost_centers_update
  AFTER UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_bank_accounts_update ON public.bank_accounts;
CREATE TRIGGER trg_audit_bank_accounts_update
  AFTER UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_chart_of_accounts_update ON public.chart_of_accounts;
CREATE TRIGGER trg_audit_chart_of_accounts_update
  AFTER UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_tipo_conta_tga_update ON public.tipo_conta_tga;
CREATE TRIGGER trg_audit_tipo_conta_tga_update
  AFTER UPDATE ON public.tipo_conta_tga
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_departments_update ON public.departments;
CREATE TRIGGER trg_audit_departments_update
  AFTER UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_organizations_update ON public.organizations;
CREATE TRIGGER trg_audit_organizations_update
  AFTER UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_cadastro_usuarios_update ON public.cadastro_usuarios;
CREATE TRIGGER trg_audit_cadastro_usuarios_update
  AFTER UPDATE ON public.cadastro_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();

DROP TRIGGER IF EXISTS trg_audit_account_mapping_update ON public.account_mapping;
CREATE TRIGGER trg_audit_account_mapping_update
  AFTER UPDATE ON public.account_mapping
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_update_trigger();
