CREATE OR REPLACE FUNCTION public.import_erp_movements_batch(
  p_org_id uuid,
  p_import_id uuid,
  p_records jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_inserted int := 0;
BEGIN
  INSERT INTO public.erp_financial_movements (
    organization_id, compensado, tipo_operacao, data_emissao, dt_compens,
    conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, c_custo,
    descricao_c_custo, valor, valor_liquido, n_documento, nome_cli_fornec,
    historico, fp, n_cheque, data_vencto, nominal_a, emitente_cheque,
    cnpj_cpf, n_extrato, filial, data_canc, data_estorno, banco,
    c_corrente, cod_cli_for, departamento, status
  )
  SELECT 
    p_org_id,
    NULLIF(trim(r->>'COMPENSADO'), ''),
    COALESCE(NULLIF(trim(r->>'TIPOOPERACAO'), ''), NULLIF(trim(r->>'TIPO'), '')),
    (NULLIF(trim(r->>'DATAEMISSAO'), ''))::date,
    (COALESCE(NULLIF(trim(r->>'DTCOMPENS'), ''), NULLIF(trim(r->>'COMPENSACAO'), '')))::date,
    NULLIF(trim(r->>'CONTACAIXA'), ''),
    NULLIF(trim(r->>'NOMECAIXA'), ''),
    NULLIF(trim(r->>'CONTACAIXADESTINO'), ''),
    COALESCE(NULLIF(trim(r->>'FORMAPAGTO'), ''), NULLIF(trim(r->>'PAGAMENTO'), '')),
    COALESCE(NULLIF(trim(r->>'CCUSTO'), ''), NULLIF(trim(r->>'CENTROCUSTO'), '')),
    NULLIF(trim(r->>'DESCRICAOCCUSTO'), ''),
    (NULLIF(trim(r->>'VALOR'), ''))::numeric,
    (NULLIF(trim(r->>'VALORLIQUIDO'), ''))::numeric,
    COALESCE(NULLIF(trim(r->>'NDOCUMENTO'), ''), NULLIF(trim(r->>'DOCUMENTO'), '')),
    COALESCE(NULLIF(trim(r->>'NOMECLIFORNEC'), ''), NULLIF(trim(r->>'CLIFORNEC'), '')),
    COALESCE(NULLIF(trim(r->>'HISTORICO'), ''), NULLIF(trim(r->>'DESCRICAO'), '')),
    NULLIF(trim(r->>'FP'), ''),
    COALESCE(NULLIF(trim(r->>'NCHEQUE'), ''), NULLIF(trim(r->>'CHEQUE'), '')),
    (COALESCE(NULLIF(trim(r->>'DATAVENCTO'), ''), NULLIF(trim(r->>'VENCTO'), ''), NULLIF(trim(r->>'VENCIMENTO'), '')))::date,
    COALESCE(NULLIF(trim(r->>'NOMINALA'), ''), NULLIF(trim(r->>'NOMINAL'), '')),
    COALESCE(NULLIF(trim(r->>'EMITENTECHEQUE'), ''), NULLIF(trim(r->>'EMITENTE'), '')),
    COALESCE(NULLIF(trim(r->>'CNPJCPF'), ''), NULLIF(trim(r->>'CNPJ'), ''), NULLIF(trim(r->>'CPF'), '')),
    COALESCE(NULLIF(trim(r->>'NEXTRATO'), ''), NULLIF(trim(r->>'EXTRATO'), '')),
    NULLIF(trim(r->>'FILIAL'), ''),
    (COALESCE(NULLIF(trim(r->>'DATACANC'), ''), NULLIF(trim(r->>'CANCELAMENTO'), '')))::date,
    (COALESCE(NULLIF(trim(r->>'DATAESTORNO'), ''), NULLIF(trim(r->>'ESTORNO'), '')))::date,
    NULLIF(trim(r->>'BANCO'), ''),
    COALESCE(NULLIF(trim(r->>'CCORRENTE'), ''), NULLIF(trim(r->>'CONTACORRENTE'), '')),
    NULLIF(trim(r->>'CODCLIFOR'), ''),
    NULLIF(trim(r->>'DEPARTAMENTO'), ''),
    'Pendente'
  FROM jsonb_array_elements(p_records) AS r;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'inserted', v_inserted);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.import_mappings_batch(
  p_org_id uuid,
  p_import_id uuid,
  p_records jsonb,
  p_mode text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_inserted int := 0;
BEGIN
  IF p_mode = 'REPLACE' THEN
    DELETE FROM public.account_mapping WHERE organization_id = p_org_id;
  END IF;

  WITH parsed AS (
    SELECT 
      upper(trim(COALESCE(r->>'CENTROCUSTO', r->>'CENTRODECUSTO', r->>'CODIGOCENTROCUSTO', r->>'CODIGOTGA', r->>'TGA', r->>'COD', r->>'CC'))) as cc_code,
      upper(trim(COALESCE(r->>'CONTACONTABIL', r->>'CODIGOREDUZIDO', r->>'REDUZIDO', r->>'CONTA', r->>'CODCONTABIL'))) as ca_code,
      COALESCE(NULLIF(trim(COALESCE(r->>'TIPOMAPEAMENTO', r->>'TIPO')), ''), 'DE/PARA') as m_type
    FROM jsonb_array_elements(p_records) AS r
  ),
  matched AS (
    SELECT 
      cc.id as cost_center_id,
      ca.id as chart_account_id,
      p.m_type
    FROM parsed p
    LEFT JOIN public.cost_centers cc ON cc.organization_id = p_org_id AND upper(trim(cc.code)) = p.cc_code AND cc.deleted_at IS NULL
    LEFT JOIN public.chart_of_accounts ca ON ca.organization_id = p_org_id AND upper(trim(ca.account_code)) = p.ca_code AND ca.deleted_at IS NULL
    WHERE cc.id IS NOT NULL AND ca.id IS NOT NULL
  ),
  deleted AS (
    DELETE FROM public.account_mapping am
    USING matched m
    WHERE am.organization_id = p_org_id AND am.cost_center_id = m.cost_center_id AND p_mode != 'INSERT_ONLY'
  )
  INSERT INTO public.account_mapping (organization_id, cost_center_id, chart_account_id, mapping_type)
  SELECT p_org_id, cost_center_id, chart_account_id, m_type 
  FROM matched m
  WHERE p_mode != 'INSERT_ONLY' OR NOT EXISTS (
    SELECT 1 FROM public.account_mapping am WHERE am.organization_id = p_org_id AND am.cost_center_id = m.cost_center_id
  );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'inserted', v_inserted);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
