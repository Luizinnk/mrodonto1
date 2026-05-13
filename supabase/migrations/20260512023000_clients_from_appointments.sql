-- Clients table fed automatically by public appointments

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  desired_procedure TEXT,
  important_notes TEXT,
  first_appointment_at TIMESTAMPTZ,
  next_appointment_at TIMESTAMPTZ,
  last_appointment_at TIMESTAMPTZ,
  total_appointments INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'site',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (lower(email));
CREATE INDEX IF NOT EXISTS idx_clients_next_appointment ON public.clients (next_appointment_at);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.sync_client_from_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service_name TEXT;
BEGIN
  SELECT name INTO service_name
  FROM public.services
  WHERE id = NEW.service_id;

  INSERT INTO public.clients (
    full_name,
    email,
    phone,
    desired_procedure,
    important_notes,
    first_appointment_at,
    next_appointment_at,
    last_appointment_at,
    total_appointments,
    source
  )
  VALUES (
    NEW.customer_name,
    lower(trim(NEW.customer_email)),
    NEW.customer_phone,
    service_name,
    NEW.notes,
    NEW.scheduled_at,
    CASE WHEN NEW.scheduled_at >= now() AND NEW.status IN ('pending', 'confirmed') THEN NEW.scheduled_at ELSE NULL END,
    NEW.scheduled_at,
    1,
    'site'
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    desired_procedure = EXCLUDED.desired_procedure,
    important_notes = COALESCE(EXCLUDED.important_notes, public.clients.important_notes),
    first_appointment_at = LEAST(public.clients.first_appointment_at, EXCLUDED.first_appointment_at),
    last_appointment_at = GREATEST(public.clients.last_appointment_at, EXCLUDED.last_appointment_at),
    next_appointment_at = CASE
      WHEN EXCLUDED.next_appointment_at IS NULL THEN public.clients.next_appointment_at
      WHEN public.clients.next_appointment_at IS NULL THEN EXCLUDED.next_appointment_at
      ELSE LEAST(public.clients.next_appointment_at, EXCLUDED.next_appointment_at)
    END,
    total_appointments = public.clients.total_appointments + 1,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_sync_client ON public.appointments;
CREATE TRIGGER appointments_sync_client
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_client_from_appointment();

-- Backfill existing appointments, if any.
INSERT INTO public.clients (
  full_name,
  email,
  phone,
  desired_procedure,
  important_notes,
  first_appointment_at,
  next_appointment_at,
  last_appointment_at,
  total_appointments,
  source
)
SELECT
  a.customer_name,
  lower(trim(a.customer_email)),
  a.customer_phone,
  s.name,
  a.notes,
  min(a.scheduled_at),
  min(a.scheduled_at) FILTER (WHERE a.scheduled_at >= now() AND a.status IN ('pending', 'confirmed')),
  max(a.scheduled_at),
  count(*)::int,
  'site'
FROM public.appointments a
LEFT JOIN public.services s ON s.id = a.service_id
GROUP BY lower(trim(a.customer_email)), a.customer_name, a.customer_phone, s.name, a.notes
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  desired_procedure = EXCLUDED.desired_procedure,
  important_notes = COALESCE(EXCLUDED.important_notes, public.clients.important_notes),
  first_appointment_at = EXCLUDED.first_appointment_at,
  next_appointment_at = EXCLUDED.next_appointment_at,
  last_appointment_at = EXCLUDED.last_appointment_at,
  total_appointments = EXCLUDED.total_appointments,
  updated_at = now();
