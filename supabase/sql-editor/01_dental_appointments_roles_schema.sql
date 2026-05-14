-- ABA: Dental Appointments & Roles Schema
-- Execute primeiro. Este script recria a base sem apagar dados.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_role_unique
ON public.user_roles(user_id, role);

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

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS duration_min INT DEFAULT 60,
  ADD COLUMN IF NOT EXISTS price_text TEXT DEFAULT 'Consultar',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'tooth',
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique
ON public.services(slug);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id),
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
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id),
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS status public.appointment_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_confirmation_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_token UUID NOT NULL DEFAULT gen_random_uuid(),
  notes TEXT
);

ALTER TABLE public.admin_access_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS admin_access_requests_user_unique
ON public.admin_access_requests(user_id)
WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  desired_procedure TEXT,
  appointment_date DATE,
  appointment_time TIME,
  status public.appointment_status DEFAULT 'pending',
  important_notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  customer_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS desired_procedure TEXT,
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS appointment_time TIME,
  ADD COLUMN IF NOT EXISTS status public.appointment_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS important_notes TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS clients_appointment_unique
ON public.clients(appointment_id)
WHERE appointment_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'busy_slots' AND c.relkind = 'v'
  ) THEN
    DROP VIEW public.busy_slots;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.busy_slots (
  appointment_id UUID PRIMARY KEY REFERENCES public.appointments(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled
ON public.appointments(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_appointments_service_scheduled
ON public.appointments(service_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_clients_status_date
ON public.clients(status, appointment_date);

CREATE INDEX IF NOT EXISTS idx_busy_slots_scheduled_at
ON public.busy_slots(scheduled_at);

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
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
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
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

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
