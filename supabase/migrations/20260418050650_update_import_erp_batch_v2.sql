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
  v_rejected int := 0;
  v_errors jsonb := '[]'::jsonb;
  r jsonb;
  v_err_msg text;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    BEGIN
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
        COALESCE(NULLIF(trim(r->>'CCUSTO'), ''), NULLIF(trim(r->>'CENTROCUSTO'), ''), NULLIF(trim(r->>'CENTRODECUSTO'), '')),
        COALESCE(NULLIF(trim(r->>'DESCRICAOCCUSTO'), ''), NULLIF(trim(r->>'NOMECENTROCUSTO'), '')),
        (COALESCE(NULLIF(trim(r->>'VALOR'), ''), NULLIF(trim(r->>'VALORBRUTO'), '')))::numeric,
        (COALESCE(NULLIF(trim(r->>'VALORLIQUIDO'), ''), NULLIF(trim(r->>'LIQUIDO'), '')))::numeric,
        COALESCE(NULLIF(trim(r->>'NDOCUMENTO'), ''), NULLIF(trim(r->>'DOCUMENTO'), ''), NULLIF(trim(r->>'DOC'), '')),
        COALESCE(NULLIF(trim(r->>'NOMECLIFORNEC'), ''), NULLIF(trim(r->>'CLIFORNEC'), ''), NULLIF(trim(r->>'CLIENTE'), ''), NULLIF(trim(r->>'FORNECEDOR'), '')),
        COALESCE(NULLIF(trim(r->>'HISTORICO'), ''), NULLIF(trim(r->>'DESCRICAO'), ''), NULLIF(trim(r->>'OBS'), '')),
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
