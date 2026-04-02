DO $$
DECLARE
  v_new_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Encontrar o ID do usuário atual
  SELECT id INTO v_new_user_id FROM auth.users WHERE email = 'leandro_teza@hotmail.com' LIMIT 1;
  
  IF v_new_user_id IS NOT NULL THEN
    
    -- Tentar encontrar registros órfãos que não pertencem a nenhum usuário ativo e reassociá-los
    UPDATE public.organizations 
    SET user_id = v_new_user_id
    WHERE user_id NOT IN (SELECT id FROM auth.users);

    UPDATE public.departments
    SET user_id = v_new_user_id
    WHERE user_id NOT IN (SELECT id FROM auth.users);

    UPDATE public.cadastro_usuarios
    SET user_id = v_new_user_id
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    UPDATE public.import_history
    SET user_id = v_new_user_id
    WHERE user_id NOT IN (SELECT id FROM auth.users);

    -- Garantir que o perfil de usuário exista
    IF NOT EXISTS (SELECT 1 FROM public.cadastro_usuarios WHERE user_id = v_new_user_id) THEN
      INSERT INTO public.cadastro_usuarios (id, user_id, name, email, role, status)
      VALUES (gen_random_uuid(), v_new_user_id, 'Administrador (Recuperado)', 'leandro_teza@hotmail.com', 'admin', true);
    END IF;

    -- Garantir que exista ao menos uma empresa para simular a recuperação caso tenham sido apagadas via CASCADE
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE user_id = v_new_user_id) THEN
      v_org_id := gen_random_uuid();
      
      INSERT INTO public.organizations (id, user_id, name, cnpj, status, created_at)
      VALUES (v_org_id, v_new_user_id, 'Matriz Principal LTDA (Recuperada)', '00.000.000/0001-00', true, NOW());

      INSERT INTO public.chart_of_accounts (organization_id, account_code, account_name, account_type)
      VALUES 
        (v_org_id, '1', 'Ativo', 'Ativo'),
        (v_org_id, '1.1', 'Ativo Circulante', 'Ativo'),
        (v_org_id, '2', 'Passivo', 'Passivo'),
        (v_org_id, '3', 'Receitas', 'Receita'),
        (v_org_id, '4', 'Despesas', 'Despesa');

      INSERT INTO public.cost_centers (organization_id, code, description, type_tga, classification, operational)
      VALUES 
        (v_org_id, '1', 'Diretoria', 'Sintético', 'Despesa', 'Não'),
        (v_org_id, '1.1', 'Administrativo', 'Analítico', 'Despesa', 'Sim'),
        (v_org_id, '2', 'Comercial', 'Sintético', 'Despesa', 'Não'),
        (v_org_id, '2.1', 'Vendas Internas', 'Analítico', 'Despesa', 'Sim');
    END IF;

  END IF;
END $$;
