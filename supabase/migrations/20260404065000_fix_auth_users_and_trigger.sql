-- Fix NULL values in auth.users tokens (GoTrue Bug 1940) which causes "Database error saving new user"
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- Drop the old unique index on CPF that was incorrectly blocking new users if the CPF was in a deleted row
DROP INDEX IF EXISTS public.cadastro_usuarios_cpf_idx;

-- Create a new unique index that correctly ignores deleted records
CREATE UNIQUE INDEX IF NOT EXISTS cadastro_usuarios_cpf_idx 
  ON public.cadastro_usuarios USING btree (cpf) 
  WHERE ((cpf IS NOT NULL) AND ((cpf)::text <> ''::text) AND (deleted_at IS NULL));

-- Update the trigger function to ignore deleted records when checking for CPF duplicates
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
    -- Ignore users that are soft-deleted when checking for duplicates
    IF EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE cpf = req_cpf AND deleted_at IS NULL) THEN
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
$function$
