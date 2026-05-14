-- ABA: Garantir acesso admin para Luiz
-- Execute depois dos scripts 01 e 02.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'luiznovakiresner228@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.admin_access_requests (
  user_id,
  email,
  full_name,
  status,
  reviewed_at,
  notes
)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Luiz Novak'),
  'approved',
  now(),
  'Acesso principal aprovado manualmente no Supabase.'
FROM auth.users
WHERE lower(email) = 'luiznovakiresner228@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  status = 'approved',
  reviewed_at = now(),
  notes = 'Acesso principal aprovado manualmente no Supabase.';

SELECT
  u.id,
  u.email,
  r.role,
  a.status AS approval_status
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.admin_access_requests a ON a.user_id = u.id
WHERE lower(u.email) = 'luiznovakiresner228@gmail.com';
