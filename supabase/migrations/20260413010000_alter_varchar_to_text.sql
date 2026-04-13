DO $$
BEGIN
  -- Alter columns in cost_centers
  ALTER TABLE public.cost_centers ALTER COLUMN code TYPE TEXT USING code::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN description TYPE TEXT USING description::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN type_tga TYPE TEXT USING type_tga::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN fixed_variable TYPE TEXT USING fixed_variable::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN classification TYPE TEXT USING classification::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN operational TYPE TEXT USING operational::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN tipo_lcto TYPE TEXT USING tipo_lcto::TEXT;
  ALTER TABLE public.cost_centers ALTER COLUMN contabiliza TYPE TEXT USING contabiliza::TEXT;
  
  -- Alter columns in chart_of_accounts
  ALTER TABLE public.chart_of_accounts ALTER COLUMN account_code TYPE TEXT USING account_code::TEXT;
  ALTER TABLE public.chart_of_accounts ALTER COLUMN classification TYPE TEXT USING classification::TEXT;
  ALTER TABLE public.chart_of_accounts ALTER COLUMN account_name TYPE TEXT USING account_name::TEXT;
  
  -- Alter columns in bank_accounts
  ALTER TABLE public.bank_accounts ALTER COLUMN account_code TYPE TEXT USING account_code::TEXT;
  ALTER TABLE public.bank_accounts ALTER COLUMN account_number TYPE TEXT USING account_number::TEXT;
  ALTER TABLE public.bank_accounts ALTER COLUMN agency TYPE TEXT USING agency::TEXT;
  
  -- Alter columns in tipo_conta_tga
  ALTER TABLE public.tipo_conta_tga ALTER COLUMN codigo TYPE TEXT USING codigo::TEXT;
  ALTER TABLE public.tipo_conta_tga ALTER COLUMN nome TYPE TEXT USING nome::TEXT;
  ALTER TABLE public.tipo_conta_tga ALTER COLUMN abreviacao TYPE TEXT USING abreviacao::TEXT;
END $$;
