-- Add new fields to employees table to complete the user profile
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cpf VARCHAR;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS observations TEXT;

-- Update RLS to allow employees to read their own record (needed for role check)
DROP POLICY IF EXISTS "employee_read_own" ON public.employees;
CREATE POLICY "employee_read_own" ON public.employees
  FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Update RLS to allow employees to see organizations they are linked to
DROP POLICY IF EXISTS "employee_organization_select" ON public.organizations;
CREATE POLICY "employee_organization_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM public.employee_companies ec
      JOIN public.employees e ON e.id = ec.employee_id
      WHERE e.email = (auth.jwt() ->> 'email')
    )
  );
