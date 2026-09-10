-- Migration: 20260908181000_create_admin_users.sql
-- Descrição: Criação da tabela public.admin_users para autorização explícita de administradores Supabase Auth

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY,
  role VARCHAR(30) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_admin_users_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_admin_users_role
    CHECK (role IN ('superadmin', 'admin'))
);

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_users
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.admin_users
  TO service_role;

COMMENT ON TABLE public.admin_users IS
  'Tabela de utilizadores autorizados como administradores. Acesso exclusivo server-side via service_role.';
