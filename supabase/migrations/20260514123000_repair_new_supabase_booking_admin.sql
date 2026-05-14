-- Repairs public booking, admin access bootstrap, and active service data for the new Supabase project.
-- Applied to project fgiozrjhqdnsiqbtjdpw on 2026-05-14.

CREATE OR REPLACE FUNCTION public.ensure_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(new.email) = 'luiznovakiresner228@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_access_requests (user_id, email, full_name, status, reviewed_at, notes)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Luiz'),
      'approved',
      now(),
      'Acesso principal aprovado automaticamente.'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'approved',
        reviewed_at = now(),
        notes = 'Acesso principal aprovado automaticamente.';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS ensure_owner_admin_on_signup ON auth.users;
CREATE TRIGGER ensure_owner_admin_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_owner_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'luiznovakiresner228@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.admin_access_requests (user_id, email, full_name, status, reviewed_at, notes)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Luiz'),
  'approved',
  now(),
  'Acesso principal aprovado automaticamente.'
FROM auth.users
WHERE lower(email) = 'luiznovakiresner228@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET status = 'approved',
    reviewed_at = now(),
    notes = 'Acesso principal aprovado automaticamente.';

GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;

DROP POLICY IF EXISTS "anon insert appointments" ON public.appointments;
CREATE POLICY "anon insert appointments"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated insert appointments" ON public.appointments;
CREATE POLICY "authenticated insert appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
