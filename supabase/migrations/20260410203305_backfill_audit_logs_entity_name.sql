DO $$
DECLARE
  v_log RECORD;
  v_name TEXT;
  v_table_name TEXT;
  v_name_col TEXT;
  v_changes JSONB;
BEGIN
  FOR v_log IN SELECT * FROM public.audit_logs ORDER BY created_at ASC LOOP
    v_name := NULL;
    v_table_name := NULL;
    
    IF v_log.entity_type IN ('usuario', 'cadastro_usuarios') THEN
      v_table_name := 'cadastro_usuarios';
      v_name_col := 'name';
    ELSIF v_log.entity_type = 'bank_accounts' THEN
      v_table_name := 'bank_accounts';
      v_name_col := 'description';
    ELSIF v_log.entity_type = 'cost_centers' THEN
      v_table_name := 'cost_centers';
      v_name_col := 'description';
    ELSIF v_log.entity_type = 'chart_of_accounts' THEN
      v_table_name := 'chart_of_accounts';
      v_name_col := 'account_name';
    ELSIF v_log.entity_type = 'tipo_conta_tga' THEN
      v_table_name := 'tipo_conta_tga';
      v_name_col := 'nome';
    ELSIF v_log.entity_type = 'departments' THEN
      v_table_name := 'departments';
      v_name_col := 'name';
    ELSIF v_log.entity_type = 'organizations' THEN
      v_table_name := 'organizations';
      v_name_col := 'name';
    END IF;

    IF v_table_name IS NOT NULL THEN
      -- Try to get current name from table
      EXECUTE format('SELECT %I FROM public.%I WHERE id = $1 LIMIT 1', v_name_col, v_table_name)
      INTO v_name
      USING v_log.entity_id;

      -- If not found, try to look at changes JSON in the log itself
      IF v_name IS NULL AND v_log.changes IS NOT NULL THEN
        BEGIN
          v_name := COALESCE(
            v_log.changes->v_name_col->>'new',
            v_log.changes->v_name_col->>'old',
            v_log.changes->'name'->>'new',
            v_log.changes->'name'->>'old',
            v_log.changes->'description'->>'new',
            v_log.changes->'description'->>'old',
            v_log.changes->'account_name'->>'new',
            v_log.changes->'account_name'->>'old'
          );
        EXCEPTION WHEN OTHERS THEN
          -- ignore
        END;
      END IF;

      -- If still not found, try to find in older logs for same entity
      IF v_name IS NULL THEN
        SELECT 
          COALESCE(
            changes->'_entity_name'->>'new',
            changes->'_entity_name'->>'old',
            changes->>'_entity_name',
            changes->'entity_name'->>'new',
            changes->'entity_name'->>'old',
            changes->>'entity_name',
            changes->v_name_col->>'new',
            changes->v_name_col->>'old',
            changes->'name'->>'new',
            changes->'name'->>'old',
            changes->'description'->>'new',
            changes->'description'->>'old',
            changes->'account_name'->>'new',
            changes->'account_name'->>'old'
          ) INTO v_name
        FROM public.audit_logs
        WHERE entity_id = v_log.entity_id AND created_at <= v_log.created_at AND id != v_log.id AND changes IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1;
      END IF;

      IF v_name IS NOT NULL THEN
        v_changes := COALESCE(v_log.changes, '{}'::jsonb);
        IF NOT v_changes ? 'entity_name' THEN
          v_changes := jsonb_set(v_changes, '{entity_name}', jsonb_build_object('old', v_name, 'new', v_name));
          v_changes := jsonb_set(v_changes, '{_entity_name}', jsonb_build_object('old', v_name, 'new', v_name));
          UPDATE public.audit_logs SET changes = v_changes WHERE id = v_log.id;
          
          IF NOT EXISTS (SELECT 1 FROM public.audit_details WHERE audit_log_id = v_log.id AND field_name = 'entity_name') THEN
            INSERT INTO public.audit_details (audit_log_id, field_name, old_value, new_value)
            VALUES (v_log.id, 'entity_name', v_name, v_name);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM public.audit_details WHERE audit_log_id = v_log.id AND field_name = '_entity_name') THEN
            INSERT INTO public.audit_details (audit_log_id, field_name, old_value, new_value)
            VALUES (v_log.id, '_entity_name', v_name, v_name);
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
