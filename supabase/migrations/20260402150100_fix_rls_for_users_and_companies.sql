-- Fix RLS for cadastro_usuarios_companies
DROP POLICY IF EXISTS "user_employee_companies_insert" ON public.cadastro_usuarios_companies;
CREATE POLICY "user_employee_companies_insert" ON public.cadastro_usuarios_companies
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "user_employee_companies_delete" ON public.cadastro_usuarios_companies;
CREATE POLICY "user_employee_companies_delete" ON public.cadastro_usuarios_companies
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "user_employee_companies_select" ON public.cadastro_usuarios_companies;
CREATE POLICY "user_employee_companies_select" ON public.cadastro_usuarios_companies
  FOR SELECT TO authenticated USING (true);
  
DROP POLICY IF EXISTS "user_employee_companies_update" ON public.cadastro_usuarios_companies;
CREATE POLICY "user_employee_companies_update" ON public.cadastro_usuarios_companies
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Fix RLS for cadastro_usuarios
DROP POLICY IF EXISTS "auth_users_select" ON public.cadastro_usuarios;
CREATE POLICY "auth_users_select" ON public.cadastro_usuarios FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_users_insert" ON public.cadastro_usuarios;
CREATE POLICY "auth_users_insert" ON public.cadastro_usuarios FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_users_update" ON public.cadastro_usuarios;
CREATE POLICY "auth_users_update" ON public.cadastro_usuarios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_users_delete" ON public.cadastro_usuarios;
CREATE POLICY "auth_users_delete" ON public.cadastro_usuarios FOR DELETE TO authenticated USING (true);

-- Also drop the previous restrictive ones to avoid conflicts or overrides
DROP POLICY IF EXISTS "employee_read_own" ON public.cadastro_usuarios;
DROP POLICY IF EXISTS "read_pending_users" ON public.cadastro_usuarios;
DROP POLICY IF EXISTS "update_pending_users" ON public.cadastro_usuarios;
DROP POLICY IF EXISTS "user_employees_delete" ON public.cadastro_usuarios;
DROP POLICY IF EXISTS "user_employees_insert" ON public.cadastro_usuarios;
DROP POLICY IF EXISTS "user_employees_select" ON public.cadastro_usuarios;
DROP POLICY IF EXISTS "user_employees_update" ON public.cadastro_usuarios;
