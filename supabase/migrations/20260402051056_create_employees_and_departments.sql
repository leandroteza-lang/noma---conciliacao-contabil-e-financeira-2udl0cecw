CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_companies (
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (employee_id, organization_id)
);

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_departments_select" ON public.departments;
CREATE POLICY "user_departments_select" ON public.departments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_departments_insert" ON public.departments;
CREATE POLICY "user_departments_insert" ON public.departments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_departments_update" ON public.departments;
CREATE POLICY "user_departments_update" ON public.departments FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_departments_delete" ON public.departments;
CREATE POLICY "user_departments_delete" ON public.departments FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_employees_select" ON public.employees;
CREATE POLICY "user_employees_select" ON public.employees FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_employees_insert" ON public.employees;
CREATE POLICY "user_employees_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_employees_update" ON public.employees;
CREATE POLICY "user_employees_update" ON public.employees FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_employees_delete" ON public.employees;
CREATE POLICY "user_employees_delete" ON public.employees FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_employee_companies_select" ON public.employee_companies;
CREATE POLICY "user_employee_companies_select" ON public.employee_companies FOR SELECT TO authenticated USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "user_employee_companies_insert" ON public.employee_companies;
CREATE POLICY "user_employee_companies_insert" ON public.employee_companies FOR INSERT TO authenticated WITH CHECK (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "user_employee_companies_delete" ON public.employee_companies;
CREATE POLICY "user_employee_companies_delete" ON public.employee_companies FOR DELETE TO authenticated USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
