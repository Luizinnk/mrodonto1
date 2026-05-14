-- Fix Supabase security advisor warning:
-- "Security Definer View" on public.busy_slots.
--
-- Instead of exposing a view over appointments, keep a tiny public table with
-- only the fields needed by the booking screen. This avoids leaking patient
-- data and removes the SECURITY DEFINER view entirely.

DROP VIEW IF EXISTS public.busy_slots;

CREATE TABLE IF NOT EXISTS public.busy_slots (
  appointment_id UUID PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_busy_slots_scheduled_at
  ON public.busy_slots (scheduled_at);

ALTER TABLE public.busy_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads busy slots" ON public.busy_slots;
CREATE POLICY "public reads busy slots"
ON public.busy_slots
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.busy_slots TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_busy_slot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.busy_slots WHERE appointment_id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.status IN ('pending', 'confirmed') THEN
    INSERT INTO public.busy_slots (appointment_id, scheduled_at, service_id, updated_at)
    VALUES (NEW.id, NEW.scheduled_at, NEW.service_id, now())
    ON CONFLICT (appointment_id)
    DO UPDATE SET
      scheduled_at = EXCLUDED.scheduled_at,
      service_id = EXCLUDED.service_id,
      updated_at = now();
  ELSE
    DELETE FROM public.busy_slots WHERE appointment_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_sync_busy_slot ON public.appointments;
CREATE TRIGGER appointments_sync_busy_slot
AFTER INSERT OR UPDATE OF scheduled_at, service_id, status OR DELETE
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_busy_slot();

INSERT INTO public.busy_slots (appointment_id, scheduled_at, service_id, updated_at)
SELECT id, scheduled_at, service_id, now()
FROM public.appointments
WHERE status IN ('pending', 'confirmed')
ON CONFLICT (appointment_id)
DO UPDATE SET
  scheduled_at = EXCLUDED.scheduled_at,
  service_id = EXCLUDED.service_id,
  updated_at = now();
