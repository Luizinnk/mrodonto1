-- Admin approval workflow and appointment reminder tracking

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS customer_confirmation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_day
  ON public.appointments (scheduled_at, reminder_sent_at, status);

CREATE TABLE IF NOT EXISTS public.admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_token UUID NOT NULL DEFAULT gen_random_uuid(),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_access_requests_status
  ON public.admin_access_requests (status, requested_at DESC);

ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own admin request" ON public.admin_access_requests;
CREATE POLICY "users read own admin request"
  ON public.admin_access_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage admin requests" ON public.admin_access_requests;
CREATE POLICY "admins manage admin requests"
  ON public.admin_access_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.is_admin_approved(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_access_requests
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;
