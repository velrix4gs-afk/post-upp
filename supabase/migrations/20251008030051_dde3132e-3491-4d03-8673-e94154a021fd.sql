-- Grant admin role to ÑØRÄ (user ID: 554e102d-8cdc-4a3a-ad4b-f7799f515366)
INSERT INTO public.user_roles (user_id, role)
VALUES ('554e102d-8cdc-4a3a-ad4b-f7799f515366', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;