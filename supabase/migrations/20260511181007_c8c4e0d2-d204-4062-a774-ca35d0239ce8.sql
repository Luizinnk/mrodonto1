
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SERVICES
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,
  price_text TEXT NOT NULL DEFAULT 'Consultar',
  icon TEXT NOT NULL DEFAULT '⭐',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads active services" ON public.services FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.services (slug, name, description, duration_min, price_text, icon, sort_order) VALUES
('avaliacao', 'Avaliação Estética', 'Consulta completa para análise do sorriso e planejamento personalizado de tratamentos.', 45, 'Gratuita', '✨', 1),
('clareamento', 'Clareamento Dental', 'Clareamento profissional com gel especializado para um sorriso até 8 tons mais claro.', 90, 'Consultar', '🦷', 2),
('harmonizacao', 'Harmonização Facial', 'Técnicas avançadas para equilíbrio e rejuvenescimento natural das feições do rosto.', 60, 'Consultar', '💉', 3),
('limpeza', 'Limpeza Dental', 'Profilaxia completa para remoção de tártaro e polimento dos dentes com ultrassom.', 50, 'Consultar', '🧹', 4),
('botox', 'Botox', 'Aplicação de toxina botulínica para suavizar linhas de expressão com resultado natural.', 30, 'Consultar', '💊', 5),
('preenchimento', 'Preenchimento Facial', 'Volumização de lábios e contornos faciais com ácido hialurônico de alta qualidade.', 45, 'Consultar', '💋', 6),
('lentes', 'Lentes de Contato Dental', 'Facetas ultrafinas de porcelana que transformam a aparência do sorriso permanentemente.', 120, 'Consultar', '🔬', 7),
('personalizado', 'Procedimento Personalizado', 'Tratamento customizado conforme as necessidades específicas de cada paciente.', 60, 'Consultar', '⭐', 8);

-- APPOINTMENTS
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'done', 'cancelled');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT,
  status appointment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Anyone can request a booking (insert) — public booking flow
CREATE POLICY "public can create appointments" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Public can read only the scheduled_at to know which slots are taken (handled via a view)
-- Admins see/manage everything
CREATE POLICY "admins read appointments" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update appointments" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public view exposing only taken time slots (no PII)
CREATE OR REPLACE VIEW public.busy_slots AS
  SELECT scheduled_at, service_id FROM public.appointments WHERE status IN ('pending','confirmed');
GRANT SELECT ON public.busy_slots TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER appointments_touch BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
