-- Repair public booking writes. Run this in Supabase SQL Editor if the site shows
-- "row-level security policy" when confirming an appointment.

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'pending';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;

DROP POLICY IF EXISTS "public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "public insert appointments" ON public.appointments;

CREATE POLICY "public insert appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  scheduled_at > now()
  AND length(trim(customer_name)) >= 2
  AND customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 8
  AND COALESCE(status, 'pending') = 'pending'
);
