-- ABA: Appointment & Booking Tables
-- Execute depois do script 01. Repara agendamento publico, clientes e horarios ocupados.

CREATE OR REPLACE FUNCTION public.sync_client_from_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_name TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  SELECT name INTO service_name
  FROM public.services
  WHERE id = NEW.service_id;

  INSERT INTO public.clients (
    appointment_id,
    full_name,
    email,
    phone,
    desired_procedure,
    appointment_date,
    appointment_time,
    status,
    important_notes,
    reminder_sent,
    customer_confirmed,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.customer_name,
    NEW.customer_email,
    NEW.customer_phone,
    COALESCE(service_name, 'Procedimento'),
    (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date,
    (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::time,
    NEW.status,
    NEW.notes,
    COALESCE(NEW.reminder_sent, false),
    COALESCE(NEW.customer_confirmed, false),
    now()
  )
  ON CONFLICT (appointment_id)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    desired_procedure = EXCLUDED.desired_procedure,
    appointment_date = EXCLUDED.appointment_date,
    appointment_time = EXCLUDED.appointment_time,
    status = EXCLUDED.status,
    important_notes = EXCLUDED.important_notes,
    reminder_sent = EXCLUDED.reminder_sent,
    customer_confirmed = EXCLUDED.customer_confirmed,
    updated_at = now();

  RETURN NEW;
END;
$$;

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

DROP TRIGGER IF EXISTS appointments_sync_client ON public.appointments;
CREATE TRIGGER appointments_sync_client
AFTER INSERT OR UPDATE OF service_id, scheduled_at, customer_name, customer_email, customer_phone, notes, status, reminder_sent, customer_confirmed
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_client_from_appointment();

DROP TRIGGER IF EXISTS appointments_sync_busy_slot ON public.appointments;
CREATE TRIGGER appointments_sync_busy_slot
AFTER INSERT OR UPDATE OF scheduled_at, service_id, status OR DELETE
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_busy_slot();

DROP POLICY IF EXISTS "public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "public reads busy slots" ON public.appointments;
DROP POLICY IF EXISTS "admins read appointments" ON public.appointments;
DROP POLICY IF EXISTS "admins update appointments" ON public.appointments;
DROP POLICY IF EXISTS "admins delete appointments" ON public.appointments;

CREATE POLICY "public can create appointments"
ON public.appointments
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "admins read appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "public reads busy slots" ON public.busy_slots;
CREATE POLICY "public reads busy slots"
ON public.busy_slots
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admins read clients" ON public.clients;
CREATE POLICY "admins read clients"
ON public.clients
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage clients" ON public.clients;
CREATE POLICY "admins manage clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.clients TO authenticated;

INSERT INTO public.busy_slots (appointment_id, scheduled_at, service_id, updated_at)
SELECT id, scheduled_at, service_id, now()
FROM public.appointments
WHERE status IN ('pending', 'confirmed')
ON CONFLICT (appointment_id)
DO UPDATE SET
  scheduled_at = EXCLUDED.scheduled_at,
  service_id = EXCLUDED.service_id,
  updated_at = now();
