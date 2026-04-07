CREATE OR REPLACE FUNCTION public.delete_organization_chart_accounts(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_total_count int;
  v_blocked_count int;
  v_deleted_count int;
BEGIN
  -- Total
  SELECT count(*) INTO v_total_count
  FROM public.chart_of_accounts
  WHERE organization_id = p_org_id;

  -- Blocked
  SELECT count(DISTINCT id) INTO v_blocked_count
  FROM public.chart_of_accounts c
  WHERE c.organization_id = p_org_id
    AND (
      EXISTS (SELECT 1 FROM public.accounting_entries WHERE debit_account_id = c.id) OR
      EXISTS (SELECT 1 FROM public.accounting_entries WHERE credit_account_id = c.id) OR
      EXISTS (SELECT 1 FROM public.account_mapping WHERE chart_account_id = c.id)
    );

  -- Delete unblocked
  DELETE FROM public.chart_of_accounts c
  WHERE c.organization_id = p_org_id
    AND NOT EXISTS (SELECT 1 FROM public.accounting_entries WHERE debit_account_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM public.accounting_entries WHERE credit_account_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM public.account_mapping WHERE chart_account_id = c.id);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'total', v_total_count,
    'deleted', v_deleted_count,
    'blocked', v_blocked_count
  );
END;
$function$;
