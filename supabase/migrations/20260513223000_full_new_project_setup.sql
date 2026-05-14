-- MR Odonto - complete idempotent setup for a fresh or partially configured
-- Supabase project.
--
-- Paste/run this whole file in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'done', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,
  price_text TEXT NOT NULL DEFAULT 'Consultar',
  icon TEXT NOT NULL DEFAULT 'tooth',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  customer_confirmed BOOLEAN NOT NULL DEFAULT false,
  customer_confirmation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_confirmation_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_token UUID NOT NULL DEFAULT gen_random_uuid(),
  notes TEXT,
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE REFERENCES public.appointments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  desired_procedure TEXT,
  appointment_date DATE,
  appointment_time TIME,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  important_notes TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  customer_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'busy_slots'
      AND c.relkind = 'v'
  ) THEN
    DROP VIEW public.busy_slots;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.busy_slots (
  appointment_id UUID PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_service_scheduled ON public.appointments(service_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_clients_status_date ON public.clients(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_busy_slots_scheduled_at ON public.busy_slots(scheduled_at);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_slots ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_access_requests
    WHERE user_id = _user_id
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id)
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  RETURN NEW;
END;
$$;

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
    NEW.reminder_sent,
    NEW.customer_confirmed,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS appointments_touch ON public.appointments;
CREATE TRIGGER appointments_touch
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS clients_touch ON public.clients;
CREATE TRIGGER clients_touch
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

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

DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;
CREATE POLICY "users see own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "own profile select" ON public.profiles;
CREATE POLICY "own profile select"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "anyone reads active services" ON public.services;
CREATE POLICY "anyone reads active services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage services" ON public.services;
CREATE POLICY "admins manage services"
ON public.services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "public reads busy slots" ON public.appointments;
DROP POLICY IF EXISTS "admins read appointments" ON public.appointments;
DROP POLICY IF EXISTS "admins update appointments" ON public.appointments;
DROP POLICY IF EXISTS "admins delete appointments" ON public.appointments;

CREATE POLICY "public can create appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  scheduled_at > now()
  AND length(trim(customer_name)) >= 2
  AND customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 8
  AND status = 'pending'
);

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

DROP POLICY IF EXISTS "users read own admin request" ON public.admin_access_requests;
CREATE POLICY "users read own admin request"
ON public.admin_access_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "users create own admin request" ON public.admin_access_requests;
CREATE POLICY "users create own admin request"
ON public.admin_access_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins manage admin requests" ON public.admin_access_requests;
CREATE POLICY "admins manage admin requests"
ON public.admin_access_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

DROP POLICY IF EXISTS "public reads busy slots" ON public.busy_slots;
CREATE POLICY "public reads busy slots"
ON public.busy_slots
FOR SELECT
TO anon, authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.busy_slots TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_access_requests TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

INSERT INTO public.services (slug, name, description, duration_min, price_text, icon, sort_order, active)
VALUES
  ('avaliacao', 'Avaliação Estética', 'Consulta completa para análise do sorriso, estética facial e planejamento personalizado.', 45, 'Consultar', 'avaliacao', 1, true),
  ('clareamento', 'Clareamento Dental', 'Clareamento profissional com protocolo seguro para iluminar o sorriso com naturalidade.', 60, 'Consultar', 'clareamento', 2, true),
  ('harmonizacao', 'Harmonização Facial', 'Planejamento facial para equilíbrio, rejuvenescimento e resultados naturais.', 60, 'Consultar', 'harmonizacao', 3, true),
  ('limpeza', 'Limpeza Dental', 'Profilaxia completa, remoção de biofilme e polimento para saúde bucal em dia.', 50, 'Consultar', 'limpeza', 4, true),
  ('profilaxia', 'Profilaxia Clínica', 'Prevenção, controle de placa e orientação para manter o sorriso saudável.', 50, 'Consultar', 'profilaxia', 5, true),
  ('botox', 'Botox', 'Aplicação de toxina botulínica com técnica precisa e acabamento natural.', 30, 'Consultar', 'botox', 6, true),
  ('preenchimento', 'Preenchimento Facial', 'Volume, contorno e equilíbrio facial com ácido hialurônico de alta qualidade.', 45, 'Consultar', 'preenchimento', 7, true),
  ('facetas', 'Facetas de Porcelana', 'Lâminas cerâmicas para transformar formato, cor e harmonia do sorriso.', 120, 'Consultar', 'facetas', 8, true),
  ('lentes', 'Lentes de Contato Dental', 'Lentes ultrafinas planejadas para um sorriso elegante, claro e proporcional.', 120, 'Consultar', 'lentes', 9, true),
  ('personalizado', 'Plano Personalizado', 'Plano de tratamento criado conforme sua avaliação clínica, estética e funcional.', 60, 'Consultar', 'personalizado', 10, true)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_min = EXCLUDED.duration_min,
  price_text = EXCLUDED.price_text,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'luiznovakiresner228@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.admin_access_requests (user_id, email, full_name, status, reviewed_at, notes)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Luiz Novak'),
  'approved',
  now(),
  'Acesso principal aprovado pela configuração inicial.'
FROM auth.users
WHERE lower(email) = 'luiznovakiresner228@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET
  status = 'approved',
  reviewed_at = now(),
  notes = 'Acesso principal aprovado pela configuração inicial.';

INSERT INTO public.busy_slots (appointment_id, scheduled_at, service_id, updated_at)
SELECT id, scheduled_at, service_id, now()
FROM public.appointments
WHERE status IN ('pending', 'confirmed')
ON CONFLICT (appointment_id)
DO UPDATE SET
  scheduled_at = EXCLUDED.scheduled_at,
  service_id = EXCLUDED.service_id,
  updated_at = now();
