CREATE OR REPLACE FUNCTION public.get_erp_filter_options(p_org_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb := '{}'::jsonb;
BEGIN
  -- Data Emissao
  v_result := jsonb_set(v_result, '{data_emissao}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT to_char(data_emissao, 'YYYY-MM-DD') AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND data_emissao IS NOT NULL
      ORDER BY val DESC
    ) sub
  ), '[]'::jsonb));
  
  -- Data Compensacao
  v_result := jsonb_set(v_result, '{dt_compens}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT to_char(dt_compens, 'YYYY-MM-DD') AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND dt_compens IS NOT NULL
      ORDER BY val DESC
    ) sub
  ), '[]'::jsonb));

  -- Data Vencto
  v_result := jsonb_set(v_result, '{data_vencto}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT to_char(data_vencto, 'YYYY-MM-DD') AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND data_vencto IS NOT NULL
      ORDER BY val DESC
    ) sub
  ), '[]'::jsonb));

  -- Data Canc
  v_result := jsonb_set(v_result, '{data_canc}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT to_char(data_canc, 'YYYY-MM-DD') AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND data_canc IS NOT NULL
      ORDER BY val DESC
    ) sub
  ), '[]'::jsonb));

  -- Data Estorno
  v_result := jsonb_set(v_result, '{data_estorno}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT to_char(data_estorno, 'YYYY-MM-DD') AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND data_estorno IS NOT NULL
      ORDER BY val DESC
    ) sub
  ), '[]'::jsonb));

  -- Tipo Operacao
  v_result := jsonb_set(v_result, '{tipo_operacao}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT tipo_operacao AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND tipo_operacao IS NOT NULL AND tipo_operacao != ''
      ORDER BY val ASC
    ) sub
  ), '[]'::jsonb));

  -- Forma Pagto
  v_result := jsonb_set(v_result, '{forma_pagto}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT forma_pagto AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND forma_pagto IS NOT NULL AND forma_pagto != ''
      ORDER BY val ASC
    ) sub
  ), '[]'::jsonb));

  -- Departamento
  v_result := jsonb_set(v_result, '{departamento}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT departamento AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND departamento IS NOT NULL AND departamento != ''
      ORDER BY val ASC
    ) sub
  ), '[]'::jsonb));

  -- Compensado
  v_result := jsonb_set(v_result, '{compensado}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT compensado AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND compensado IS NOT NULL AND compensado != ''
      ORDER BY val ASC
    ) sub
  ), '[]'::jsonb));

  -- FP
  v_result := jsonb_set(v_result, '{fp}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT fp AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND fp IS NOT NULL AND fp != ''
      ORDER BY val ASC
    ) sub
  ), '[]'::jsonb));

  -- Banco
  v_result := jsonb_set(v_result, '{banco}', COALESCE((
    SELECT jsonb_agg(val) FROM (
      SELECT DISTINCT banco AS val 
      FROM erp_financial_movements 
      WHERE (p_org_id IS NULL OR organization_id = p_org_id) AND deleted_at IS NULL AND banco IS NOT NULL AND banco != ''
      ORDER BY val ASC
    ) sub
  ), '[]'::jsonb));

  RETURN v_result;
END;
$$;
