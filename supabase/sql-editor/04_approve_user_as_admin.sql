-- ABA: Approve User as Admin
-- Use este script para aprovar qualquer email que deva acessar o painel.
-- Troque o email abaixo se precisar aprovar outro usuario.

WITH target_user AS (
  SELECT id, email, raw_user_meta_data
  FROM auth.users
  WHERE lower(email) = lower('luiznovakiresner228@gmail.com')
  LIMIT 1
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM target_user
ON CONFLICT (user_id, role) DO NOTHING;

WITH target_user AS (
  SELECT id, email, raw_user_meta_data
  FROM auth.users
  WHERE lower(email) = lower('luiznovakiresner228@gmail.com')
  LIMIT 1
)
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
  COALESCE(raw_user_meta_data->>'full_name', email),
  'approved',
  now(),
  'Usuario aprovado manualmente.'
FROM target_user
ON CONFLICT (user_id)
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  status = 'approved',
  reviewed_at = now(),
  notes = 'Usuario aprovado manualmente.';

SELECT
  'admin_check' AS check_name,
  u.email,
  r.role,
  a.status
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.admin_access_requests a ON a.user_id = u.id
WHERE lower(u.email) = lower('luiznovakiresner228@gmail.com');
