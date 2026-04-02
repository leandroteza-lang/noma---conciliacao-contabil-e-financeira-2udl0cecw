DO $
BEGIN
  -- Fix permission downgrade:
  -- Ensure that any employee record associated with an organization owner is set to 'admin'
  -- because the recent role addition defaulted to 'collaborator' and downgraded the owners.
  UPDATE public.employees e
  SET role = 'admin'
  WHERE e.email IN (
    SELECT au.email 
    FROM auth.users au
    JOIN public.organizations o ON o.user_id = au.id
  ) AND e.role != 'admin';
END $;
