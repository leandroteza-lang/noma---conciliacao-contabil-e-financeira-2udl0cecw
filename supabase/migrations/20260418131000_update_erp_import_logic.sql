CREATE OR REPLACE FUNCTION public.import_erp_movements_batch_v2(p_org_id uuid, p_import_id uuid, p_records jsonb, p_mode text DEFAULT 'INSERT_ONLY')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inserted int := 0;
  v_rejected int := 0;
  v_errors jsonb := '[]'::jsonb;
  r jsonb;
  v_err_msg text;
  v_n_extrato text;
  v_n_documento text;
  v_valor numeric;
  v_c_custo text;
  v_existing_id uuid;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    BEGIN
      v_n_extrato := COALESCE(NULLIF(trim(r->>'NEXTRATO'), ''), NULLIF(trim(r->>'EXTRATO'), ''));
      v_n_documento := COALESCE(NULLIF(trim(r->>'NDOCUMENTO'), ''), NULLIF(trim(r->>'DOCUMENTO'), ''), NULLIF(trim(r->>'DOC'), ''));
      v_valor := (COALESCE(NULLIF(trim(r->>'VALOR'), ''), NULLIF(trim(r->>'VALORBRUTO'), '')))::numeric;
      v_c_custo := COALESCE(NULLIF(trim(r->>'CCUSTO'), ''), NULLIF(trim(r->>'CENTROCUSTO'), ''), NULLIF(trim(r->>'CENTRODECUSTO'), ''));

      v_existing_id := NULL;
      
      SELECT id INTO v_existing_id
      FROM public.erp_financial_movements
      WHERE organization_id = p_org_id
        AND COALESCE(n_extrato, '') = COALESCE(v_n_extrato, '')
        AND COALESCE(n_documento, '') = COALESCE(v_n_documento, '')
        AND COALESCE(valor, 0) = COALESCE(v_valor, 0)
        AND COALESCE(c_custo, '') = COALESCE(v_c_custo, '')
        AND deleted_at IS NULL
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        IF p_mode = 'INSERT_ONLY' THEN
          CONTINUE;
        ELSE
          UPDATE public.erp_financial_movements SET
            compensado = COALESCE(NULLIF(trim(r->>'COMPENSADO'), ''), NULLIF(trim(r->>'STATUS'), '')),
            tipo_operacao = COALESCE(NULLIF(trim(r->>'TIPOOPERACAO'), ''), NULLIF(trim(r->>'TIPO'), '')),
            data_emissao = (COALESCE(NULLIF(trim(r->>'DATAEMISSAO'), ''), NULLIF(trim(r->>'EMISSAO'), ''), NULLIF(trim(r->>'DATA'), '')))::date,
            dt_compens = (COALESCE(NULLIF(trim(r->>'DTCOMPENS'), ''), NULLIF(trim(r->>'COMPENSACAO'), '')))::date,
            conta_caixa = COALESCE(NULLIF(trim(r->>'CONTACAIXA'), ''), NULLIF(trim(r->>'CONTA'), '')),
            nome_caixa = COALESCE(NULLIF(trim(r->>'NOMECAIXA'), ''), NULLIF(trim(r->>'BANCO'), '')),
            conta_caixa_destino = NULLIF(trim(r->>'CONTACAIXADESTINO'), ''),
            forma_pagto = COALESCE(NULLIF(trim(r->>'FORMAPAGTO'), ''), NULLIF(trim(r->>'PAGAMENTO'), '')),
            descricao_c_custo = COALESCE(NULLIF(trim(r->>'DESCRICAOCCUSTO'), ''), NULLIF(trim(r->>'NOMECENTROCUSTO'), '')),
            valor_liquido = (COALESCE(NULLIF(trim(r->>'VALORLIQUIDO'), ''), NULLIF(trim(r->>'LIQUIDO'), '')))::numeric,
            nome_cli_fornec = COALESCE(NULLIF(trim(r->>'NOMECLIFORNEC'), ''), NULLIF(trim(r->>'CLIFORNEC'), ''), NULLIF(trim(r->>'CLIENTE'), ''), NULLIF(trim(r->>'FORNECEDOR'), '')),
            historico = COALESCE(NULLIF(trim(r->>'HISTORICO'), ''), NULLIF(trim(r->>'DESCRICAO'), ''), NULLIF(trim(r->>'OBS'), '')),
            fp = NULLIF(trim(r->>'FP'), ''),
            n_cheque = COALESCE(NULLIF(trim(r->>'NCHEQUE'), ''), NULLIF(trim(r->>'CHEQUE'), '')),
            data_vencto = (COALESCE(NULLIF(trim(r->>'DATAVENCTO'), ''), NULLIF(trim(r->>'VENCTO'), ''), NULLIF(trim(r->>'VENCIMENTO'), '')))::date,
            nominal_a = COALESCE(NULLIF(trim(r->>'NOMINALA'), ''), NULLIF(trim(r->>'NOMINAL'), '')),
            emitente_cheque = COALESCE(NULLIF(trim(r->>'EMITENTECHEQUE'), ''), NULLIF(trim(r->>'EMITENTE'), '')),
            cnpj_cpf = COALESCE(NULLIF(trim(r->>'CNPJCPF'), ''), NULLIF(trim(r->>'CNPJ'), ''), NULLIF(trim(r->>'CPF'), '')),
            filial = NULLIF(trim(r->>'FILIAL'), ''),
            data_canc = (COALESCE(NULLIF(trim(r->>'DATACANC'), ''), NULLIF(trim(r->>'CANCELAMENTO'), '')))::date,
            data_estorno = (COALESCE(NULLIF(trim(r->>'DATAESTORNO'), ''), NULLIF(trim(r->>'ESTORNO'), '')))::date,
            banco = COALESCE(NULLIF(trim(r->>'BANCO'), ''), NULLIF(trim(r->>'CODBANCO'), '')),
            c_corrente = COALESCE(NULLIF(trim(r->>'CCORRENTE'), ''), NULLIF(trim(r->>'CONTACORRENTE'), '')),
            cod_cli_for = COALESCE(NULLIF(trim(r->>'CODCLIFOR'), ''), NULLIF(trim(r->>'CODCLIENTE'), '')),
            departamento = NULLIF(trim(r->>'DEPARTAMENTO'), '')
          WHERE id = v_existing_id;
          
          v_inserted := v_inserted + 1;
          CONTINUE;
        END IF;
      END IF;

      INSERT INTO public.erp_financial_movements (
        organization_id, compensado, tipo_operacao, data_emissao, dt_compens,
        conta_caixa, nome_caixa, conta_caixa_destino, forma_pagto, c_custo,
        descricao_c_custo, valor, valor_liquido, n_documento, nome_cli_fornec,
        historico, fp, n_cheque, data_vencto, nominal_a, emitente_cheque,
        cnpj_cpf, n_extrato, filial, data_canc, data_estorno, banco,
        c_corrente, cod_cli_for, departamento, status
      )
      VALUES (
        p_org_id,
        COALESCE(NULLIF(trim(r->>'COMPENSADO'), ''), NULLIF(trim(r->>'STATUS'), '')),
        COALESCE(NULLIF(trim(r->>'TIPOOPERACAO'), ''), NULLIF(trim(r->>'TIPO'), '')),
        (COALESCE(NULLIF(trim(r->>'DATAEMISSAO'), ''), NULLIF(trim(r->>'EMISSAO'), ''), NULLIF(trim(r->>'DATA'), '')))::date,
        (COALESCE(NULLIF(trim(r->>'DTCOMPENS'), ''), NULLIF(trim(r->>'COMPENSACAO'), '')))::date,
        COALESCE(NULLIF(trim(r->>'CONTACAIXA'), ''), NULLIF(trim(r->>'CONTA'), '')),
        COALESCE(NULLIF(trim(r->>'NOMECAIXA'), ''), NULLIF(trim(r->>'BANCO'), '')),
        NULLIF(trim(r->>'CONTACAIXADESTINO'), ''),
        COALESCE(NULLIF(trim(r->>'FORMAPAGTO'), ''), NULLIF(trim(r->>'PAGAMENTO'), '')),
        v_c_custo,
        COALESCE(NULLIF(trim(r->>'DESCRICAOCCUSTO'), ''), NULLIF(trim(r->>'NOMECENTROCUSTO'), '')),
        v_valor,
        (COALESCE(NULLIF(trim(r->>'VALORLIQUIDO'), ''), NULLIF(trim(r->>'LIQUIDO'), '')))::numeric,
        v_n_documento,
        COALESCE(NULLIF(trim(r->>'NOMECLIFORNEC'), ''), NULLIF(trim(r->>'CLIFORNEC'), ''), NULLIF(trim(r->>'CLIENTE'), ''), NULLIF(trim(r->>'FORNECEDOR'), '')),
        COALESCE(NULLIF(trim(r->>'HISTORICO'), ''), NULLIF(trim(r->>'DESCRICAO'), ''), NULLIF(trim(r->>'OBS'), '')),
        NULLIF(trim(r->>'FP'), ''),
        COALESCE(NULLIF(trim(r->>'NCHEQUE'), ''), NULLIF(trim(r->>'CHEQUE'), '')),
        (COALESCE(NULLIF(trim(r->>'DATAVENCTO'), ''), NULLIF(trim(r->>'VENCTO'), ''), NULLIF(trim(r->>'VENCIMENTO'), '')))::date,
        COALESCE(NULLIF(trim(r->>'NOMINALA'), ''), NULLIF(trim(r->>'NOMINAL'), '')),
        COALESCE(NULLIF(trim(r->>'EMITENTECHEQUE'), ''), NULLIF(trim(r->>'EMITENTE'), '')),
        COALESCE(NULLIF(trim(r->>'CNPJCPF'), ''), NULLIF(trim(r->>'CNPJ'), ''), NULLIF(trim(r->>'CPF'), '')),
        v_n_extrato,
        NULLIF(trim(r->>'FILIAL'), ''),
        (COALESCE(NULLIF(trim(r->>'DATACANC'), ''), NULLIF(trim(r->>'CANCELAMENTO'), '')))::date,
        (COALESCE(NULLIF(trim(r->>'DATAESTORNO'), ''), NULLIF(trim(r->>'ESTORNO'), '')))::date,
        COALESCE(NULLIF(trim(r->>'BANCO'), ''), NULLIF(trim(r->>'CODBANCO'), '')),
        COALESCE(NULLIF(trim(r->>'CCORRENTE'), ''), NULLIF(trim(r->>'CONTACORRENTE'), '')),
        COALESCE(NULLIF(trim(r->>'CODCLIFOR'), ''), NULLIF(trim(r->>'CODCLIENTE'), '')),
        NULLIF(trim(r->>'DEPARTAMENTO'), ''),
        'Pendente'
      );
      v_inserted := v_inserted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_rejected := v_rejected + 1;
      v_err_msg := SQLERRM;
      IF jsonb_array_length(v_errors) < 100 THEN
        v_errors := v_errors || jsonb_build_object(
          'row', COALESCE(r->>'_originalIndex', '0')::int,
          'error', v_err_msg
        );
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'inserted', v_inserted, 'rejected', v_rejected, 'errors', v_errors);
END;
$function$;

CREATE INDEX IF NOT EXISTS erp_financial_movements_dedup_idx 
ON public.erp_financial_movements (organization_id, COALESCE(n_extrato, ''), COALESCE(n_documento, ''), COALESCE(valor, 0), COALESCE(c_custo, '')) 
WHERE deleted_at IS NULL;
