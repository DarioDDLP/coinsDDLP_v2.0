-- Habilita Row-Level Security en las tablas de la colección.
-- Modelo de acceso: público (anon) = solo lectura; logueado (authenticated) = lectura + escritura.
-- service_role ignora RLS, por lo que las Edge Functions no se ven afectadas.
--
-- Idempotente: elimina cualquier política previa de estas tablas y recrea el
-- conjunto correcto. Las políticas previas estaban inertes (RLS desactivado),
-- por lo que eliminarlas no cambia el comportamiento actual.

-- 1) Limpieza: borra todas las políticas existentes de las 3 tablas.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('euro', 'peseta', 'peseta_type')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) Activa RLS (idempotente: no falla si ya estaba activo).
alter table public.euro        enable row level security;
alter table public.peseta      enable row level security;
alter table public.peseta_type enable row level security;

-- 3) Políticas: lectura pública, escritura solo autenticados.

-- ---- euro ----
create policy "Lectura pública" on public.euro
  for select to anon, authenticated using (true);
create policy "Inserción autenticados" on public.euro
  for insert to authenticated with check (true);
create policy "Actualización autenticados" on public.euro
  for update to authenticated using (true) with check (true);
create policy "Borrado autenticados" on public.euro
  for delete to authenticated using (true);

-- ---- peseta ----
create policy "Lectura pública" on public.peseta
  for select to anon, authenticated using (true);
create policy "Inserción autenticados" on public.peseta
  for insert to authenticated with check (true);
create policy "Actualización autenticados" on public.peseta
  for update to authenticated using (true) with check (true);
create policy "Borrado autenticados" on public.peseta
  for delete to authenticated using (true);

-- ---- peseta_type ----
create policy "Lectura pública" on public.peseta_type
  for select to anon, authenticated using (true);
create policy "Inserción autenticados" on public.peseta_type
  for insert to authenticated with check (true);
create policy "Actualización autenticados" on public.peseta_type
  for update to authenticated using (true) with check (true);
create policy "Borrado autenticados" on public.peseta_type
  for delete to authenticated using (true);
