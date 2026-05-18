CREATE OR REPLACE FUNCTION public.import_erp_movements_batch_v3(p_org_id uuid, p_import_id uuid, p_records jsonb, p_mode text DEFAULT 'INSERT_ONLY'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inserted int := 0;
  v_updated int := 0;
  v_ignored int := 0;
  v_rejected int := 0;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  -- We set a 600s timeout just in case
  SET LOCAL statement_timeout = '600s';

  CREATE TEMP TABLE tmp_erp_movs ON COMMIT DROP AS
  SELECT 
    (r->>'_originalIndex')::int as row_idx,
    p_org_id as organization_id,
    COALESCE(NULLIF(btrim(r->>'COMPENSADO'), ''), NULLIF(btrim(r->>'STATUS'), '')) as compensado,
    COALESCE(NULLIF(btrim(r->>'TIPOOPERACAO'), ''), NULLIF(btrim(r->>'TIPO'), '')) as tipo_operacao,
    (COALESCE(NULLIF(btrim(r->>'DATAEMISSAO'), ''), NULLIF(btrim(r->>'EMISSAO'), ''), NULLIF(btrim(r->>'DATA'), '')))::date as data_emissao,
    (COALESCE(NULLIF(btrim(r->>'DTCOMPENS'), ''), NULLIF(btrim(r->>'COMPENSACAO'), '')))::date as dt_compens,
    COALESCE(NULLIF(btrim(r->>'CONTACAIXA'), ''), NULLIF(btrim(r->>'CONTA'), '')) as conta_caixa,
    COALESCE(NULLIF(btrim(r->>'NOMECAIXA'), ''), NULLIF(btrim(r->>'BANCO'), '')) as nome_caixa,
    NULLIF(btrim(r->>'CONTACAIXADESTINO'), '') as conta_caixa_destino,
    COALESCE(NULLIF(btrim(r->>'FORMAPAGTO'), ''), NULLIF(btrim(r->>'PAGAMENTO'), '')) as forma_pagto,
    btrim(COALESCE(r->>'CCUSTO', r->>'CENTROCUSTO', r->>'CENTRODECUSTO', '')) as c_custo,
    COALESCE(NULLIF(btrim(r->>'DESCRICAOCCUSTO'), ''), NULLIF(btrim(r->>'NOMECENTROCUSTO'), '')) as descricao_c_custo,
    (NULLIF(btrim(COALESCE(r->>'VALOR', r->>'VALORBRUTO', '')), ''))::numeric as valor,
    (NULLIF(btrim(COALESCE(r->>'VALORLIQUIDO', r->>'LIQUIDO', '')), ''))::numeric as valor_liquido,
    btrim(COALESCE(r->>'NDOCUMENTO', r->>'DOCUMENTO', r->>'DOC', '')) as n_documento,
    COALESCE(NULLIF(btrim(r->>'NOMECLIFORNEC'), ''), NULLIF(btrim(r->>'CLIFORNEC'), ''), NULLIF(btrim(r->>'CLIENTE'), ''), NULLIF(btrim(r->>'FORNECEDOR'), '')) as nome_cli_fornec,
    COALESCE(NULLIF(btrim(r->>'HISTORICO'), ''), NULLIF(btrim(r->>'DESCRICAO'), ''), NULLIF(btrim(r->>'OBS'), '')) as historico,
    NULLIF(btrim(r->>'FP'), '') as fp,
    COALESCE(NULLIF(btrim(r->>'NCHEQUE'), ''), NULLIF(btrim(r->>'CHEQUE'), '')) as n_cheque,
    (COALESCE(NULLIF(btrim(r->>'DATAVENCTO'), ''), NULLIF(btrim(r->>'VENCTO'), ''), NULLIF(btrim(r->>'VENCIMENTO'), '')))::date as data_vencto,
    COALESCE(NULLIF(btrim(r->>'NOMINALA'), ''), NULLIF(btrim(r->>'NOMINAL'), '')) as nominal_a,
    COALESCE(NULLIF(btrim(r->>'EMITENTECHEQUE'), ''), NULLIF(btrim(r->>'EMITENTE'), '')) as emitente_cheque,
    COALESCE(NULLIF(btrim(r->>'CNPJCPF'), ''), NULLIF(btrim(r->>'CNPJ'), ''), NULLIF(btrim(r->>'CPF'), '')) as cnpj_cpf,
    btrim(COALESCE(r->>'NEXTRATO', r->>'EXTRATO', '')) as n_extrato,
    NULLIF(btrim(r->>'FILIAL'), '') as filial,
    (COALESCE(NULLIF(btrim(r->>'DATACANC'), ''), NULLIF(btrim(r->>'CANCELAMENTO'), '')))::date as data_canc,
    (COALESCE(NULLIF(btrim(r->>'DATAESTORNO'), ''), NULLIF(btrim(r->>'ESTORNO'), '')))::date as data_estorno,
    COALESCE(NULLIF(btrim(r->>'BANCO'), ''), NULLIF(btrim(r->>'CODBANCO'), '')) as banco,
    COALESCE(NULLIF(btrim(r->>'CCORRENTE'), ''), NULLIF(btrim(r->>'CONTACORRENTE'), '')) as c_corrente,
    COALESCE(NULLIF(btrim(r->>'CODCLIFOR'), ''), NULLIF(btrim(r->>'CODCLIENTE'), '')) as cod_cli_for,
    NULLIF(btrim(r->>'DEPARTAMENTO'), '') as departamento,
    'Pendente' as status
  FROM jsonb_array_elements(p_records) AS r;

  IF p_mode = 'INSERT_ONLY' THEN
    WITH existing AS (
      SELECT e.id, t.row_idx
      FROM tmp_erp_movs t
      JOIN public.erp_financial_movements e
        ON e.organization_id = t.organization_id
        AND btrim(COALESCE(e.n_extrato, '')) = t.n_extrato
        AND btrim(COALESCE(e.n_documento, '')) = t.n_documento
        AND COALESCE(e.valor, e.valor_liquido, 0) = COALESCE(t.valor, t.valor_liquido, 0)
        AND btrim(COALESCE(e.c_custo, '')) = t.c_custo
        AND e.deleted_at IS NULL
    ),
    inserted AS (
      INSERT INTO public.erp_financial_movements (
        organization_id, compensado, tipo_operacao, data_emissao, dt_compens,
        conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, c_custo,
        descricao_c_custo, valor, valor_liquido, n_documento, nome_cli_fornec,
        historico, fp, n_cheque, data_vencto, nominal_a, emitente_cheque,
        cnpj_cpf, n_extrato, filial, data_canc, data_estorno, banco,
        c_corrente, cod_cli_for, departamento, status
      )
      SELECT 
        organization_id, compensado, tipo_operacao, data_emissao, dt_compens,
        conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, NULLIF(c_custo, ''),
        descricao_c_custo, valor, valor_liquido, NULLIF(n_documento, ''), nome_cli_fornec,
        historico, fp, n_cheque, data_vencto, nominal_a, emitente_cheque,
        cnpj_cpf, NULLIF(n_extrato, ''), filial, data_canc, data_estorno, banco,
        c_corrente, cod_cli_for, departamento, status
      FROM tmp_erp_movs t
      WHERE NOT EXISTS (SELECT 1 FROM existing e WHERE e.row_idx = t.row_idx)
      RETURNING id
    )
    SELECT count(*) INTO v_inserted FROM inserted;
    
    SELECT count(*) INTO v_ignored FROM existing;
  ELSE
    -- UPDATE mode
    WITH existing AS (
      SELECT e.id as existing_id, t.*
      FROM tmp_erp_movs t
      JOIN public.erp_financial_movements e
        ON e.organization_id = t.organization_id
        AND btrim(COALESCE(e.n_extrato, '')) = t.n_extrato
        AND btrim(COALESCE(e.n_documento, '')) = t.n_documento
        AND COALESCE(e.valor, e.valor_liquido, 0) = COALESCE(t.valor, t.valor_liquido, 0)
        AND btrim(COALESCE(e.c_custo, '')) = t.c_custo
        AND e.deleted_at IS NULL
    ),
    updated AS (
      UPDATE public.erp_financial_movements e SET
        compensado = COALESCE(t.compensado, e.compensado),
        tipo_operacao = COALESCE(t.tipo_operacao, e.tipo_operacao),
        data_emissao = COALESCE(t.data_emissao, e.data_emissao),
        dt_compens = COALESCE(t.dt_compens, e.dt_compens),
        conta_caixa = COALESCE(t.conta_caixa, e.conta_caixa),
        nome_caixa = COALESCE(t.nome_caixa, e.nome_caixa),
        conta_caixa_destino = COALESCE(t.conta_caixa_destino, e.conta_caixa_destino),
        forma_pagto = COALESCE(t.forma_pagto, e.forma_pagto),
        descricao_c_custo = COALESCE(t.descricao_c_custo, e.descricao_c_custo),
        valor = COALESCE(t.valor, e.valor),
        valor_liquido = COALESCE(t.valor_liquido, e.valor_liquido),
        nome_cli_fornec = COALESCE(t.nome_cli_fornec, e.nome_cli_fornec),
        historico = COALESCE(t.historico, e.historico),
        fp = COALESCE(t.fp, e.fp),
        n_cheque = COALESCE(t.n_cheque, e.n_cheque),
        data_vencto = COALESCE(t.data_vencto, e.data_vencto),
        nominal_a = COALESCE(t.nominal_a, e.nominal_a),
        emitente_cheque = COALESCE(t.emitente_cheque, e.emitente_cheque),
        cnpj_cpf = COALESCE(t.cnpj_cpf, e.cnpj_cpf),
        filial = COALESCE(t.filial, e.filial),
        data_canc = COALESCE(t.data_canc, e.data_canc),
        data_estorno = COALESCE(t.data_estorno, e.data_estorno),
        banco = COALESCE(t.banco, e.banco),
        c_corrente = COALESCE(t.c_corrente, e.c_corrente),
        cod_cli_for = COALESCE(t.cod_cli_for, e.cod_cli_for),
        departamento = COALESCE(t.departamento, e.departamento)
      FROM existing t
      WHERE e.id = t.existing_id
      RETURNING e.id
    ),
    inserted AS (
      INSERT INTO public.erp_financial_movements (
        organization_id, compensado, tipo_operacao, data_emissao, dt_compens,
        conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, c_custo,
        descricao_c_custo, valor, valor_liquido, n_documento, nome_cli_fornec,
        historico, fp, n_cheque, data_vencto, nominal_a, emitente_cheque,
        cnpj_cpf, n_extrato, filial, data_canc, data_estorno, banco,
        c_corrente, cod_cli_for, departamento, status
      )
      SELECT 
        organization_id, compensado, tipo_operacao, data_emissao, dt_compens,
        conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, NULLIF(c_custo, ''),
        descricao_c_custo, valor, valor_liquido, NULLIF(n_documento, ''), nome_cli_fornec,
        historico, fp, n_cheque, data_vencto, nominal_a, emitente_cheque,
        cnpj_cpf, NULLIF(n_extrato, ''), filial, data_canc, data_estorno, banco,
        c_corrente, cod_cli_for, departamento, status
      FROM tmp_erp_movs t
      WHERE NOT EXISTS (SELECT 1 FROM existing e WHERE e.row_idx = t.row_idx)
      RETURNING id
    )
    SELECT count(*) INTO v_updated FROM updated;
    SELECT count(*) INTO v_inserted FROM inserted;
  END IF;

  RETURN jsonb_build_object('success', true, 'inserted', v_inserted, 'updated', v_updated, 'ignored', v_ignored, 'rejected', v_rejected, 'errors', v_errors);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
