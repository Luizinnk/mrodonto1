-- HOTFIX: liberar agendamento publico
-- Rode este SQL em qualquer aba do SQL Editor.

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "public appointment insert" ON public.appointments;

CREATE POLICY "public can create appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'appointments'
ORDER BY policyname;
