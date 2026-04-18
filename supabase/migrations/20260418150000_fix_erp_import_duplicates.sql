DROP INDEX IF EXISTS public.erp_financial_movements_dedup_idx;

CREATE INDEX IF NOT EXISTS erp_financial_movements_dedup_idx 
ON public.erp_financial_movements 
USING btree (
  organization_id, 
  btrim(COALESCE(n_extrato, '')), 
  btrim(COALESCE(n_documento, '')), 
  COALESCE(valor, valor_liquido, (0)::numeric), 
  btrim(COALESCE(c_custo, ''))
) WHERE (deleted_at IS NULL);

CREATE OR REPLACE FUNCTION public.import_erp_movements_batch_v2(p_org_id uuid, p_import_id uuid, p_records jsonb, p_mode text DEFAULT 'INSERT_ONLY'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inserted int := 0;
  v_rejected int := 0;
  v_ignored int := 0;
  v_updated int := 0;
  v_errors jsonb := '[]'::jsonb;
  r jsonb;
  v_err_msg text;
  v_n_extrato text;
  v_n_documento text;
  v_valor numeric;
  v_valor_liquido numeric;
  v_c_custo text;
  v_existing_id uuid;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    BEGIN
      -- Extração robusta garantindo que valores nulos ou vazios sejam tratados como string vazia para a comparação
      v_n_extrato := btrim(COALESCE(r->>'NEXTRATO', r->>'EXTRATO', ''));
      v_n_documento := btrim(COALESCE(r->>'NDOCUMENTO', r->>'DOCUMENTO', r->>'DOC', ''));
      v_valor := (NULLIF(btrim(COALESCE(r->>'VALOR', r->>'VALORBRUTO', '')), ''))::numeric;
      v_valor_liquido := (NULLIF(btrim(COALESCE(r->>'VALORLIQUIDO', r->>'LIQUIDO', '')), ''))::numeric;
      v_c_custo := btrim(COALESCE(r->>'CCUSTO', r->>'CENTROCUSTO', r->>'CENTRODECUSTO', ''));

      v_existing_id := NULL;
      
      -- Busca considerando espaços em branco e unificando o campo valor caso um deles seja nulo
      SELECT id INTO v_existing_id
      FROM public.erp_financial_movements
      WHERE organization_id = p_org_id
        AND btrim(COALESCE(n_extrato, '')) = v_n_extrato
        AND btrim(COALESCE(n_documento, '')) = v_n_documento
        AND COALESCE(valor, valor_liquido, 0) = COALESCE(v_valor, v_valor_liquido, 0)
        AND btrim(COALESCE(c_custo, '')) = v_c_custo
        AND deleted_at IS NULL
      LIMIT 1;

      IF v_existing_id IS NOT NULL THEN
        IF p_mode = 'INSERT_ONLY' THEN
          v_ignored := v_ignored + 1;
          CONTINUE;
        ELSE
          UPDATE public.erp_financial_movements SET
            compensado = COALESCE(NULLIF(btrim(r->>'COMPENSADO'), ''), NULLIF(btrim(r->>'STATUS'), '')),
            tipo_operacao = COALESCE(NULLIF(btrim(r->>'TIPOOPERACAO'), ''), NULLIF(btrim(r->>'TIPO'), '')),
            data_emissao = (COALESCE(NULLIF(btrim(r->>'DATAEMISSAO'), ''), NULLIF(btrim(r->>'EMISSAO'), ''), NULLIF(btrim(r->>'DATA'), '')))::date,
            dt_compens = (COALESCE(NULLIF(btrim(r->>'DTCOMPENS'), ''), NULLIF(btrim(r->>'COMPENSACAO'), '')))::date,
            conta_caixa = COALESCE(NULLIF(btrim(r->>'CONTACAIXA'), ''), NULLIF(btrim(r->>'CONTA'), '')),
            nome_caixa = COALESCE(NULLIF(btrim(r->>'NOMECAIXA'), ''), NULLIF(btrim(r->>'BANCO'), '')),
            conta_caixa_destino = NULLIF(btrim(r->>'CONTACAIXADESTINO'), ''),
            forma_pagto = COALESCE(NULLIF(btrim(r->>'FORMAPAGTO'), ''), NULLIF(btrim(r->>'PAGAMENTO'), '')),
            descricao_c_custo = COALESCE(NULLIF(btrim(r->>'DESCRICAOCCUSTO'), ''), NULLIF(btrim(r->>'NOMECENTROCUSTO'), '')),
            valor = COALESCE(v_valor, valor),
            valor_liquido = COALESCE(v_valor_liquido, valor_liquido),
            nome_cli_fornec = COALESCE(NULLIF(btrim(r->>'NOMECLIFORNEC'), ''), NULLIF(btrim(r->>'CLIFORNEC'), ''), NULLIF(btrim(r->>'CLIENTE'), ''), NULLIF(btrim(r->>'FORNECEDOR'), '')),
            historico = COALESCE(NULLIF(btrim(r->>'HISTORICO'), ''), NULLIF(btrim(r->>'DESCRICAO'), ''), NULLIF(btrim(r->>'OBS'), '')),
            fp = NULLIF(btrim(r->>'FP'), ''),
            n_cheque = COALESCE(NULLIF(btrim(r->>'NCHEQUE'), ''), NULLIF(btrim(r->>'CHEQUE'), '')),
            data_vencto = (COALESCE(NULLIF(btrim(r->>'DATAVENCTO'), ''), NULLIF(btrim(r->>'VENCTO'), ''), NULLIF(btrim(r->>'VENCIMENTO'), '')))::date,
            nominal_a = COALESCE(NULLIF(btrim(r->>'NOMINALA'), ''), NULLIF(btrim(r->>'NOMINAL'), '')),
            emitente_cheque = COALESCE(NULLIF(btrim(r->>'EMITENTECHEQUE'), ''), NULLIF(btrim(r->>'EMITENTE'), '')),
            cnpj_cpf = COALESCE(NULLIF(btrim(r->>'CNPJCPF'), ''), NULLIF(btrim(r->>'CNPJ'), ''), NULLIF(btrim(r->>'CPF'), '')),
            filial = NULLIF(btrim(r->>'FILIAL'), ''),
            data_canc = (COALESCE(NULLIF(btrim(r->>'DATACANC'), ''), NULLIF(btrim(r->>'CANCELAMENTO'), '')))::date,
            data_estorno = (COALESCE(NULLIF(btrim(r->>'DATAESTORNO'), ''), NULLIF(btrim(r->>'ESTORNO'), '')))::date,
            banco = COALESCE(NULLIF(btrim(r->>'BANCO'), ''), NULLIF(btrim(r->>'CODBANCO'), '')),
            c_corrente = COALESCE(NULLIF(btrim(r->>'CCORRENTE'), ''), NULLIF(btrim(r->>'CONTACORRENTE'), '')),
            cod_cli_for = COALESCE(NULLIF(btrim(r->>'CODCLIFOR'), ''), NULLIF(btrim(r->>'CODCLIENTE'), '')),
            departamento = NULLIF(btrim(r->>'DEPARTAMENTO'), '')
          WHERE id = v_existing_id;
          
          v_updated := v_updated + 1;
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
        COALESCE(NULLIF(btrim(r->>'COMPENSADO'), ''), NULLIF(btrim(r->>'STATUS'), '')),
        COALESCE(NULLIF(btrim(r->>'TIPOOPERACAO'), ''), NULLIF(btrim(r->>'TIPO'), '')),
        (COALESCE(NULLIF(btrim(r->>'DATAEMISSAO'), ''), NULLIF(btrim(r->>'EMISSAO'), ''), NULLIF(btrim(r->>'DATA'), '')))::date,
        (COALESCE(NULLIF(btrim(r->>'DTCOMPENS'), ''), NULLIF(btrim(r->>'COMPENSACAO'), '')))::date,
        COALESCE(NULLIF(btrim(r->>'CONTACAIXA'), ''), NULLIF(btrim(r->>'CONTA'), '')),
        COALESCE(NULLIF(btrim(r->>'NOMECAIXA'), ''), NULLIF(btrim(r->>'BANCO'), '')),
        NULLIF(btrim(r->>'CONTACAIXADESTINO'), ''),
        COALESCE(NULLIF(btrim(r->>'FORMAPAGTO'), ''), NULLIF(btrim(r->>'PAGAMENTO'), '')),
        NULLIF(v_c_custo, ''),
        COALESCE(NULLIF(btrim(r->>'DESCRICAOCCUSTO'), ''), NULLIF(btrim(r->>'NOMECENTROCUSTO'), '')),
        v_valor,
        v_valor_liquido,
        NULLIF(v_n_documento, ''),
        COALESCE(NULLIF(btrim(r->>'NOMECLIFORNEC'), ''), NULLIF(btrim(r->>'CLIFORNEC'), ''), NULLIF(btrim(r->>'CLIENTE'), ''), NULLIF(btrim(r->>'FORNECEDOR'), '')),
        COALESCE(NULLIF(btrim(r->>'HISTORICO'), ''), NULLIF(btrim(r->>'DESCRICAO'), ''), NULLIF(btrim(r->>'OBS'), '')),
        NULLIF(btrim(r->>'FP'), ''),
        COALESCE(NULLIF(btrim(r->>'NCHEQUE'), ''), NULLIF(btrim(r->>'CHEQUE'), '')),
        (COALESCE(NULLIF(btrim(r->>'DATAVENCTO'), ''), NULLIF(btrim(r->>'VENCTO'), ''), NULLIF(btrim(r->>'VENCIMENTO'), '')))::date,
        COALESCE(NULLIF(btrim(r->>'NOMINALA'), ''), NULLIF(btrim(r->>'NOMINAL'), '')),
        COALESCE(NULLIF(btrim(r->>'EMITENTECHEQUE'), ''), NULLIF(btrim(r->>'EMITENTE'), '')),
        COALESCE(NULLIF(btrim(r->>'CNPJCPF'), ''), NULLIF(btrim(r->>'CNPJ'), ''), NULLIF(btrim(r->>'CPF'), '')),
        NULLIF(v_n_extrato, ''),
        NULLIF(btrim(r->>'FILIAL'), ''),
        (COALESCE(NULLIF(btrim(r->>'DATACANC'), ''), NULLIF(btrim(r->>'CANCELAMENTO'), '')))::date,
        (COALESCE(NULLIF(btrim(r->>'DATAESTORNO'), ''), NULLIF(btrim(r->>'ESTORNO'), '')))::date,
        COALESCE(NULLIF(btrim(r->>'BANCO'), ''), NULLIF(btrim(r->>'CODBANCO'), '')),
        COALESCE(NULLIF(btrim(r->>'CCORRENTE'), ''), NULLIF(btrim(r->>'CONTACORRENTE'), '')),
        COALESCE(NULLIF(btrim(r->>'CODCLIFOR'), ''), NULLIF(btrim(r->>'CODCLIENTE'), '')),
        NULLIF(btrim(r->>'DEPARTAMENTO'), ''),
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

  RETURN jsonb_build_object('success', true, 'inserted', v_inserted, 'updated', v_updated, 'ignored', v_ignored, 'rejected', v_rejected, 'errors', v_errors);
END;
$function$;
