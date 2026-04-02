-- 1. Add columns
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS company_name VARCHAR;

-- 2. Drop existing open RLS policies if any
DROP POLICY IF EXISTS "authenticated_all_organizations" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_all_bank_accounts" ON public.bank_accounts;

-- 3. Enable RLS and Create strict RLS policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_organization_select" ON public.organizations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_organization_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_organization_update" ON public.organizations FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_organization_delete" ON public.organizations FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_bank_accounts_select" ON public.bank_accounts FOR SELECT TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()));
CREATE POLICY "org_bank_accounts_insert" ON public.bank_accounts FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()));
CREATE POLICY "org_bank_accounts_update" ON public.bank_accounts FOR UPDATE TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()));
CREATE POLICY "org_bank_accounts_delete" ON public.bank_accounts FOR DELETE TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()));

-- Also secure other tables
DO $
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['account_mapping', 'accounting_entries', 'chart_of_accounts', 'cost_centers', 'financial_movements']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_all_%s" ON public.%I', t, t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "org_%s_select" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_select" ON public.%I FOR SELECT TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_%s_insert" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_%s_update" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_update" ON public.%I FOR UPDATE TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()))', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_%s_delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "org_%s_delete" ON public.%I FOR DELETE TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid()))', t, t);
  END LOOP;
END $;

-- 4. Trigger to automatically create an organization when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $
BEGIN
  INSERT INTO public.organizations (id, user_id, name)
  VALUES (gen_random_uuid(), NEW.id, 'Minha Empresa');
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Seed user
DO $
DECLARE
  new_user_id uuid;
  new_org_id uuid;
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
      '{"name": "Leandro"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    
    -- Trigger will create the organization. Let's fetch it to add bank accounts.
    SELECT id INTO new_org_id FROM public.organizations WHERE user_id = new_user_id LIMIT 1;

    INSERT INTO public.bank_accounts (organization_id, company_name, account_code, account_type, description, bank_code, agency, account_number, classification) VALUES
    (new_org_id, 'NOMA PARTS', '1.1.01.02.001', 'Conta Corrente', 'NOMA PARTS - Banco do Brasil', '001', '1234-5', '98765-4', 'Caixa Equivalente'),
    (new_org_id, 'LS ALMEIDA', '1.1.01.02.002', 'Conta Corrente', 'LS ALMEIDA - Itaú', '341', '4321', '12345-6', 'Caixa Equivalente');
  END IF;
END $;
