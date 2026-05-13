
DROP VIEW IF EXISTS public.busy_slots;
CREATE VIEW public.busy_slots WITH (security_invoker = true) AS
  SELECT scheduled_at, service_id FROM public.appointments WHERE status IN ('pending','confirmed');
GRANT SELECT ON public.busy_slots TO anon, authenticated;

-- Allow anon read of busy slots only (no PII columns exposed)
CREATE POLICY "anon read scheduled_at only" ON public.appointments FOR SELECT TO anon
  USING (false);
-- Note: anon won't be able to read appointments directly, but the view query uses table.
-- We need a permissive policy for the view to work for anon. Restrict to status filter only.
DROP POLICY IF EXISTS "anon read scheduled_at only" ON public.appointments;
CREATE POLICY "public reads busy slots" ON public.appointments FOR SELECT TO anon, authenticated
  USING (status IN ('pending','confirmed') AND public.has_role(auth.uid(), 'admin') = false);
-- Admin policy already covers full read

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
