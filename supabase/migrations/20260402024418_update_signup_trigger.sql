CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $function$
DECLARE
  org_name text;
BEGIN
  -- Extract organization name from metadata, default to 'Minha Empresa' if not provided
  org_name := COALESCE(NEW.raw_user_meta_data->>'organization', 'Minha Empresa');

  INSERT INTO public.organizations (id, user_id, name)
  VALUES (gen_random_uuid(), NEW.id, org_name);
  
  -- Auto confirm email
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;
