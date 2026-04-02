-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR,
    name VARCHAR,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_code VARCHAR,
    account_type VARCHAR,
    description VARCHAR,
    bank_code VARCHAR,
    agency VARCHAR,
    account_number VARCHAR,
    check_digit VARCHAR,
    classification VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cost_centers table
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    code VARCHAR,
    description VARCHAR,
    parent_id UUID REFERENCES public.cost_centers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_code VARCHAR,
    account_name VARCHAR,
    account_type VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create account_mapping table
CREATE TABLE IF NOT EXISTS public.account_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE CASCADE,
    chart_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
    mapping_type VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_movements table
CREATE TABLE IF NOT EXISTS public.financial_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    movement_date DATE,
    description VARCHAR,
    amount DECIMAL,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    status VARCHAR DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create accounting_entries table
CREATE TABLE IF NOT EXISTS public.accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    entry_date DATE,
    debit_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
    credit_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
    amount DECIMAL,
    description VARCHAR,
    status VARCHAR DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for authenticated users
DO $
BEGIN
    DROP POLICY IF EXISTS "authenticated_all_organizations" ON public.organizations;
    CREATE POLICY "authenticated_all_organizations" ON public.organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated_all_bank_accounts" ON public.bank_accounts;
    CREATE POLICY "authenticated_all_bank_accounts" ON public.bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated_all_cost_centers" ON public.cost_centers;
    CREATE POLICY "authenticated_all_cost_centers" ON public.cost_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated_all_chart_of_accounts" ON public.chart_of_accounts;
    CREATE POLICY "authenticated_all_chart_of_accounts" ON public.chart_of_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated_all_account_mapping" ON public.account_mapping;
    CREATE POLICY "authenticated_all_account_mapping" ON public.account_mapping FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated_all_financial_movements" ON public.financial_movements;
    CREATE POLICY "authenticated_all_financial_movements" ON public.financial_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "authenticated_all_accounting_entries" ON public.accounting_entries;
    CREATE POLICY "authenticated_all_accounting_entries" ON public.accounting_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $;

-- Seed an initial user
DO $
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'leandro_teza@hotmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'leandro_teza@hotmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $;
