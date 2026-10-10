-- ─────────────────────────────────────────────────────────────────────────────
-- Registro de accesos (solo lo ve el admin en /admin/registro)
--
--   · `access_visit` → una visita = una pestaña abierta: IP, ubicación,
--                      navegador, dispositivo, usuario, duración
--   · `access_event` → lo que pasa dentro de la visita: páginas, inicios y
--                      cierres de sesión, intentos de login fallidos
--
-- Solo escribe la Edge Function `access-log` (service_role); el admin lee y
-- puede vaciar. pg_cron borra cada noche las visitas con más de 90 días.
-- La IP es un dato personal (RGPD): por eso la retención es corta.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tablas
create table if not exists public.access_visit (
  id               uuid primary key default gen_random_uuid(),
  "startedAt"      timestamptz not null default now(),
  "lastSeenAt"     timestamptz not null default now(),
  "userId"         uuid references auth.users(id) on delete set null,
  -- Copia del nombre: se conserva aunque se borre el usuario
  "userName"       text,
  ip               text,
  country          text,
  "countryCode"    text,
  region           text,
  city             text,
  "userAgent"      text,
  browser          text,
  "browserVersion" text,
  os               text,
  "deviceType"     text check ("deviceType" in ('desktop', 'tablet', 'mobile', 'bot')),
  screen           text,
  language         text,
  "appLang"        text,
  referrer         text,
  "landingPath"    text,
  "appVersion"     text
);

create table if not exists public.access_event (
  id          bigint generated always as identity primary key,
  "visitId"   uuid not null references public.access_visit(id) on delete cascade,
  at          timestamptz not null default now(),
  type        text not null check (type in ('page', 'login', 'logout', 'login_failed')),
  path        text,
  "userId"    uuid references auth.users(id) on delete set null,
  detail      text
);

create index if not exists access_visit_started_at_idx on public.access_visit ("startedAt" desc);
create index if not exists access_visit_user_id_idx    on public.access_visit ("userId");
create index if not exists access_event_visit_id_idx   on public.access_event ("visitId");

-- 2. RLS: solo el admin lee y borra; nadie escribe salvo service_role
alter table public.access_visit enable row level security;
alter table public.access_event enable row level security;

create policy "access_visit_select_admin" on public.access_visit
  for select to authenticated using (public.is_admin());
create policy "access_visit_delete_admin" on public.access_visit
  for delete to authenticated using (public.is_admin());

create policy "access_event_select_admin" on public.access_event
  for select to authenticated using (public.is_admin());
create policy "access_event_delete_admin" on public.access_event
  for delete to authenticated using (public.is_admin());

grant select, delete on public.access_visit to authenticated;
grant select, delete on public.access_event to authenticated;

-- 3. Retención: cada noche se borran las visitas con más de 90 días (los eventos, en cascada)
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

select cron.schedule(
  'access-log-retention',
  '15 3 * * *',
  $$delete from public.access_visit where "startedAt" < now() - interval '90 days'$$
);

-- 4. Vista con lo que pinta la tabla del admin: nº de páginas y duración
--    (security_invoker: aplica la RLS de quien consulta, o sea, solo el admin)
create or replace view public.access_visit_summary
with (security_invoker = true) as
select
  v.*,
  (select count(*) from public.access_event e
    where e."visitId" = v.id and e.type = 'page')::int          as "pageCount",
  extract(epoch from v."lastSeenAt" - v."startedAt")::int        as "durationSeconds"
from public.access_visit v;

grant select on public.access_visit_summary to authenticated;

-- 5. Filtros del registro (los comparten la tabla, las cifras y el Excel)
--    p_user: null = todos · 'anon' = sin sesión · 'users' = con sesión · uuid = ese usuario
--    p_exclude: uuid cuyas visitas se ocultan ("Ocultar mis visitas")
--    p_search: IP, ciudad, región, país, navegador, sistema o nombre
create or replace function public.access_visit_filtered(
  p_from    timestamptz default null,
  p_user    text        default null,
  p_exclude uuid        default null,
  p_search  text        default null
)
returns setof public.access_visit_summary
language sql
stable
security invoker
set search_path = ''
as $$
  select s.* from public.access_visit_summary s
  where (p_from is null or s."startedAt" >= p_from)
    and (
      p_user is null
      or (p_user = 'anon'  and s."userId" is null)
      or (p_user = 'users' and s."userId" is not null)
      or (p_user not in ('anon', 'users') and s."userId"::text = p_user)
    )
    and (p_exclude is null or s."userId" is distinct from p_exclude)
    and (
      coalesce(p_search, '') = ''
      or concat_ws(' ', s.ip, s.city, s.region, s.country, s.browser, s.os, s."userName")
         ilike '%' || p_search || '%'
    );
$$;

-- Cifras de la cabecera sobre las mismas visitas filtradas
create or replace function public.access_log_stats(
  p_from    timestamptz default null,
  p_user    text        default null,
  p_exclude uuid        default null,
  p_search  text        default null
)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with v as (
    select * from public.access_visit_filtered(p_from, p_user, p_exclude, p_search)
  ),
  e as (
    select e.type from public.access_event e join v on v.id = e."visitId"
  )
  select json_build_object(
    'visits',       (select count(*) from v),
    'visitors',     (select count(distinct ip) from v),
    'users',        (select count(distinct "userId") from v),
    'logins',       (select count(*) from e where type = 'login'),
    'failedLogins', (select count(*) from e where type = 'login_failed')
  );
$$;

grant execute on function public.access_visit_filtered(timestamptz, text, uuid, text) to authenticated;
grant execute on function public.access_log_stats(timestamptz, text, uuid, text)      to authenticated;
