-- Permisos explícitos de acceso al Data API (PostgREST / supabase-js).
-- A partir de octubre 2026, las tablas nuevas en "public" no estarán
-- expuestas por defecto. Esta migración declara explícitamente los permisos
-- para las tablas existentes, independizándonos del comportamiento legacy.

grant usage on schema public to anon, authenticated;

-- euro: lectura pública, escritura solo autenticados
grant select on public.euro to anon, authenticated;
grant insert, update, delete on public.euro to authenticated;

-- peseta: lectura pública, escritura solo autenticados
grant select on public.peseta to anon, authenticated;
grant insert, update, delete on public.peseta to authenticated;

-- peseta_type: lectura pública, escritura solo autenticados
grant select on public.peseta_type to anon, authenticated;
grant insert, update, delete on public.peseta_type to authenticated;

-- numista_usage: lectura solo autenticados, escritura via service_role (Edge Function)
grant select on public.numista_usage to authenticated;
