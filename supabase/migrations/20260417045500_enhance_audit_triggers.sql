-- Enhance Audit Triggers to track INSERT, UPDATE and DELETE on all core tables

-- 1. Create or Replace the core trigger function to handle full lifecycle
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

-- 2. Drop and Recreate triggers for all audited tables to capture INSERT, UPDATE, DELETE
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'account_mapping',
    'bank_accounts',
    'cadastro_usuarios',
    'chart_of_accounts',
    'cost_centers',
    'departments',
    'organizations',
    'tipo_conta_tga'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I_update ON public.%I', t, t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION audit_table_update_trigger()', t, t);
  END LOOP;
END $$;
