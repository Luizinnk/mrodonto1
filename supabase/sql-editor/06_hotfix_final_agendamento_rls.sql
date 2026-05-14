-- HOTFIX FINAL: agendamento publico via Supabase anon/authenticated
-- Rode no projeto correto:
-- https://fgiozrjhqdnsiqbtjdpw.supabase.co

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.appointments FROM authenticated;

GRANT INSERT ON public.appointments TO anon;
GRANT INSERT ON public.appointments TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.appointments TO authenticated;

DROP POLICY IF EXISTS "public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "public appointment insert" ON public.appointments;
DROP POLICY IF EXISTS "anon insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "authenticated insert appointments" ON public.appointments;

CREATE POLICY "anon insert appointments"
ON public.appointments
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "authenticated insert appointments"
ON public.appointments
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admins read appointments" ON public.appointments;
CREATE POLICY "admins read appointments"
ON public.appointments
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update appointments" ON public.appointments;
CREATE POLICY "admins update appointments"
ON public.appointments
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete appointments" ON public.appointments;
CREATE POLICY "admins delete appointments"
ON public.appointments
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

SELECT
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'appointments'
ORDER BY policyname;
