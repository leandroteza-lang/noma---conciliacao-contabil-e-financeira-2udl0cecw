CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  RETURN v_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  org_name text;
  req_name text;
  req_role text;
  req_cpf text;
  req_phone text;
  req_dep_id uuid;
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

  IF req_cpf IS NOT NULL AND req_cpf != '' THEN
    IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE cpf = req_cpf) THEN
      RAISE EXCEPTION 'CPF_DUPLICATE';
    END IF;
  END IF;

  INSERT INTO public.cadastro_usuarios (
    id, user_id, name, email, role, cpf, phone, department_id, approval_status, status
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
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
$function$;
