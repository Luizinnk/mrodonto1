-- Enforces admin access approval through admin_access_requests.
-- Any pending/rejected request cannot keep the admin role.
-- Owner email: luiznovakiresner228@gmail.com

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.force_owner_admin_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(new.email) = 'luiznovakiresner228@gmail.com' THEN
    new.status := 'approved';
    new.reviewed_at := COALESCE(new.reviewed_at, now());
    new.reviewer_note := COALESCE(new.reviewer_note, 'Acesso principal aprovado automaticamente.');
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS force_owner_admin_request_before_save ON public.admin_access_requests;
CREATE TRIGGER force_owner_admin_request_before_save
BEFORE INSERT OR UPDATE ON public.admin_access_requests
FOR EACH ROW EXECUTE FUNCTION private.force_owner_admin_request();

CREATE OR REPLACE FUNCTION private.sync_admin_role_from_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.status = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = new.user_id
      AND role = 'admin';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS sync_admin_role_from_request_on_change ON public.admin_access_requests;
CREATE TRIGGER sync_admin_role_from_request_on_change
AFTER INSERT OR UPDATE OF status ON public.admin_access_requests
FOR EACH ROW EXECUTE FUNCTION private.sync_admin_role_from_request();

CREATE OR REPLACE FUNCTION private.ensure_admin_request_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_access_requests (
    user_id,
    email,
    full_name,
    status,
    requested_at,
    reviewed_at,
    reviewer_note,
    notes
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE WHEN lower(new.email) = 'luiznovakiresner228@gmail.com' THEN 'approved' ELSE 'pending' END,
    now(),
    CASE WHEN lower(new.email) = 'luiznovakiresner228@gmail.com' THEN now() ELSE NULL END,
    CASE WHEN lower(new.email) = 'luiznovakiresner228@gmail.com' THEN 'Acesso principal aprovado automaticamente.' ELSE NULL END,
    CASE
      WHEN lower(new.email) = 'luiznovakiresner228@gmail.com'
        THEN 'Acesso principal aprovado automaticamente.'
      ELSE 'Aguardando aprovação por email para luiznovakiresner228@gmail.com.'
    END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = excluded.email,
      full_name = COALESCE(excluded.full_name, public.admin_access_requests.full_name),
      status = CASE
        WHEN lower(excluded.email) = 'luiznovakiresner228@gmail.com'
          THEN 'approved'
        ELSE public.admin_access_requests.status
      END,
      reviewed_at = CASE
        WHEN lower(excluded.email) = 'luiznovakiresner228@gmail.com'
          THEN now()
        ELSE public.admin_access_requests.reviewed_at
      END,
      reviewer_note = CASE
        WHEN lower(excluded.email) = 'luiznovakiresner228@gmail.com'
          THEN 'Acesso principal aprovado automaticamente.'
        ELSE public.admin_access_requests.reviewer_note
      END,
      notes = excluded.notes;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS ensure_admin_request_on_signup ON auth.users;
CREATE TRIGGER ensure_admin_request_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.ensure_admin_request_for_new_user();

DELETE FROM public.user_roles r
USING public.admin_access_requests a
WHERE a.user_id = r.user_id
  AND r.role = 'admin'
  AND a.status <> 'approved';

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.admin_access_requests
WHERE status = 'approved'
ON CONFLICT (user_id, role) DO NOTHING;

DROP FUNCTION IF EXISTS public.sync_admin_role_from_request();
DROP FUNCTION IF EXISTS public.ensure_admin_request_for_new_user();

NOTIFY pgrst, 'reload schema';
