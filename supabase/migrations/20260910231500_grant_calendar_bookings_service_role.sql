-- Migration: 20260910231500_grant_calendar_bookings_service_role.sql
-- Descrição: Conceder privilégios de tabela à role service_role em public.calendar_bookings

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.calendar_bookings
TO service_role;
