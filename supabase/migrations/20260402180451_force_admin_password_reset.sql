DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'leandro_teza@hotmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Force password reset to Skip@Pass for existing user
    UPDATE auth.users 
    SET encrypted_password = crypt('Skip@Pass', gen_salt('bf'))
    WHERE id = v_user_id;
    
    -- Ensure the user has admin role in auth.users metadata
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    )
    WHERE id = v_user_id;
  ELSE
    -- Create user if somehow deleted
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'leandro_teza@hotmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Leandro", "role": "admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  -- Ensure profile exists and has full admin permissions
  IF NOT EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE user_id = v_user_id) THEN
    INSERT INTO public.cadastro_usuarios (
      id, user_id, name, email, role, approval_status, status, permissions
    ) VALUES (
      gen_random_uuid(), v_user_id, 'Leandro', 'leandro_teza@hotmail.com', 'admin', 'approved', true, '["all"]'::jsonb
    );
  ELSE
    UPDATE public.cadastro_usuarios
    SET role = 'admin', permissions = '["all"]'::jsonb, approval_status = 'approved', status = true
    WHERE user_id = v_user_id;
  END IF;
  
END $$;
