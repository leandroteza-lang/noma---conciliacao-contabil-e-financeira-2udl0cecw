DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'cadastro_usuarios_cpf_idx' AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX cadastro_usuarios_cpf_idx ON public.cadastro_usuarios (cpf) WHERE cpf IS NOT NULL AND cpf != '';
  END IF;
END $;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $
DECLARE
  org_name text;
  req_name text;
  req_role text;
  req_cpf text;
  req_phone text;
  req_dep_id uuid;
  req_admin_id uuid;
BEGIN
  req_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  org_name := NEW.raw_user_meta_data->>'organization';
  req_role := COALESCE(NEW.raw_user_meta_data->>'role', 'collaborator');
  req_cpf := NEW.raw_user_meta_data->>'cpf';
  req_phone := NEW.raw_user_meta_data->>'phone';
  
  BEGIN
    req_dep_id := (NEW.raw_user_meta_data->>'department_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    req_dep_id := NULL;
  END;

  BEGIN
    req_admin_id := (NEW.raw_user_meta_data->>'admin_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    req_admin_id := NULL;
  END;

  IF req_cpf IS NOT NULL AND req_cpf != '' THEN
    IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE cpf = req_cpf) THEN
      RAISE EXCEPTION 'CPF_DUPLICATE';
    END IF;
  END IF;

  INSERT INTO public.cadastro_usuarios (
    id, user_id, name, email, role, cpf, phone, department_id, approval_status, status
  ) VALUES (
    gen_random_uuid(),
    COALESCE(req_admin_id, NEW.id),
    req_name,
    NEW.email,
    req_role,
    req_cpf,
    req_phone,
    req_dep_id,
    'pending',
    true
  );

  IF org_name IS NOT NULL AND org_name != '' THEN
    INSERT INTO public.organizations (id, user_id, name)
    VALUES (gen_random_uuid(), NEW.id, org_name);
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "read_pending_users" ON public.cadastro_usuarios;
CREATE POLICY "read_pending_users" ON public.cadastro_usuarios
  FOR SELECT TO authenticated
  USING (approval_status = 'pending');

DROP POLICY IF EXISTS "update_pending_users" ON public.cadastro_usuarios;
CREATE POLICY "update_pending_users" ON public.cadastro_usuarios
  FOR UPDATE TO authenticated
  USING (approval_status = 'pending');
