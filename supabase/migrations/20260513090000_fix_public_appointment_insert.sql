-- Ensure the public booking form can create appointments while RLS stays enabled.
-- This keeps reads/updates/deletes restricted to admins and exposes no private data.

GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;

DROP POLICY IF EXISTS "public can create appointments" ON public.appointments;
CREATE POLICY "public can create appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  service_id IN (
    SELECT id
    FROM public.services
    WHERE active = true
  )
  AND scheduled_at > now()
  AND length(trim(customer_name)) >= 2
  AND customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 8
  AND status = 'pending'
);
