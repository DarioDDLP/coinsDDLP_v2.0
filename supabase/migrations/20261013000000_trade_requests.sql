-- ─────────────────────────────────────────────────────────────────────────────
-- Intercambios: solicitudes de monedas repetidas a otra colección
--
--   · `euro_ownership.tradeHidden` → el dueño no ofrece esa moneda aunque la tenga repetida
--   · `trade_request` / `trade_request_item` → solicitud de un usuario a una colección
--   · Solo se leen por las dos partes; se escriben únicamente con las funciones
--     `trade_request_*` (security definer), que validan permisos, estado y disponibles
--   · Permiso `trade.request` para pedir (no lo admite el Invitado)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Monedas que el dueño no ofrece
alter table public.euro_ownership
  add column if not exists "tradeHidden" boolean not null default false;

-- 2. Tablas
create table if not exists public.trade_request (
  id              uuid primary key default gen_random_uuid(),
  "requesterId"   uuid not null references auth.users(id) on delete cascade,
  "requesterName" text not null,
  "ownerId"       uuid not null references public.owner(id) on delete cascade,
  kind            text not null check (kind in ('exchange', 'purchase', 'gift')),
  status          text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  message         text check (char_length(message) <= 500),
  response        text check (char_length(response) <= 500),
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now(),
  "ownerSeen"     boolean not null default false,
  "requesterSeen" boolean not null default true,
  constraint trade_request_not_self check ("requesterId" <> "ownerId")
);

create index if not exists trade_request_owner_idx on public.trade_request ("ownerId", "createdAt" desc);
create index if not exists trade_request_requester_idx on public.trade_request ("requesterId", "createdAt" desc);

create table if not exists public.trade_request_item (
  "requestId" uuid not null references public.trade_request(id) on delete cascade,
  "euroId"    text not null references public.euro(id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  primary key ("requestId", "euroId")
);

alter table public.trade_request      enable row level security;
alter table public.trade_request_item enable row level security;

-- 3. Lectura: solo las dos partes. Sin políticas de escritura: todo va por las funciones
create policy "trade_request_select_parties" on public.trade_request
  for select to authenticated
  using (auth.uid() = "requesterId" or auth.uid() = "ownerId");

create policy "trade_request_item_select_parties" on public.trade_request_item
  for select to authenticated
  using (
    exists (
      select 1 from public.trade_request r
      where r.id = "requestId" and (auth.uid() = r."requesterId" or auth.uid() = r."ownerId")
    )
  );

grant select on public.trade_request      to authenticated;
grant select on public.trade_request_item to authenticated;

-- 4. Funciones
create or replace function public.trade_request_create(
  p_owner   uuid,
  p_kind    text,
  p_message text,
  p_items   jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text;
  v_id   uuid;
  v_item record;
  v_free integer;
begin
  if v_uid is null or not public.has_permission('trade.request') then
    raise exception 'No tienes permiso para solicitar monedas' using errcode = '42501';
  end if;
  if p_owner = v_uid then
    raise exception 'No puedes solicitar monedas a tu propia colección' using errcode = '22023';
  end if;
  if not exists (select 1 from public.owner where id = p_owner) then
    raise exception 'La colección no existe' using errcode = '22023';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La solicitud no tiene monedas' using errcode = '22023';
  end if;
  if (select count(*) from public.trade_request
      where "requesterId" = v_uid and status = 'pending') >= 20 then
    raise exception 'Tienes demasiadas solicitudes pendientes' using errcode = '54000';
  end if;

  select coalesce(
           (select o.name from public.owner o where o.id = v_uid),
           nullif(u.raw_user_meta_data ->> 'name', ''),
           u.email
         )
    into v_name
    from auth.users u
   where u.id = v_uid;

  insert into public.trade_request ("requesterId", "requesterName", "ownerId", kind, message)
  values (v_uid, v_name, p_owner, p_kind, nullif(trim(p_message), ''))
  returning id into v_id;

  for v_item in
    select x."euroId", x.quantity
      from jsonb_to_recordset(p_items) as x("euroId" text, quantity integer)
  loop
    select greatest(eo.uds - 1, 0)
      into v_free
      from public.euro_ownership eo
     where eo."euroId" = v_item."euroId"
       and eo."ownerId" = p_owner
       and not eo."tradeHidden";

    if coalesce(v_free, 0) < coalesce(v_item.quantity, 0) or coalesce(v_item.quantity, 0) < 1 then
      raise exception 'Una de las monedas ya no está disponible' using errcode = '22023';
    end if;

    insert into public.trade_request_item ("requestId", "euroId", quantity)
    values (v_id, v_item."euroId", v_item.quantity);
  end loop;

  return v_id;
end;
$$;

-- Dueño: aceptar o rechazar una pendiente
create or replace function public.trade_request_respond(p_id uuid, p_status text, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('accepted', 'rejected') then
    raise exception 'Estado no válido' using errcode = '22023';
  end if;

  update public.trade_request
     set status = p_status,
         response = nullif(trim(p_response), ''),
         "updatedAt" = now(),
         "ownerSeen" = true,
         "requesterSeen" = false
   where id = p_id and "ownerId" = auth.uid() and status = 'pending';

  if not found then
    raise exception 'La solicitud no se puede responder' using errcode = '42501';
  end if;
end;
$$;

-- Solicitante: cancelar una pendiente
create or replace function public.trade_request_cancel(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.trade_request
     set status = 'cancelled', "updatedAt" = now(), "requesterSeen" = true, "ownerSeen" = false
   where id = p_id and "requesterId" = auth.uid() and status = 'pending';

  if not found then
    raise exception 'La solicitud no se puede cancelar' using errcode = '42501';
  end if;
end;
$$;

-- Cualquiera de las dos partes: marcar como completada una aceptada
create or replace function public.trade_request_complete(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.trade_request
     set status = 'completed',
         "updatedAt" = now(),
         "ownerSeen" = ("ownerId" = auth.uid()),
         "requesterSeen" = ("requesterId" = auth.uid())
   where id = p_id
     and (auth.uid() = "requesterId" or auth.uid() = "ownerId")
     and status = 'accepted';

  if not found then
    raise exception 'La solicitud no se puede completar' using errcode = '42501';
  end if;
end;
$$;

-- Marca como vista la solicitud para quien la abre
create or replace function public.trade_request_mark_seen(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.trade_request
     set "ownerSeen" = "ownerSeen" or "ownerId" = auth.uid(),
         "requesterSeen" = "requesterSeen" or "requesterId" = auth.uid()
   where id = p_id and (auth.uid() = "requesterId" or auth.uid() = "ownerId");
$$;

-- Email de la otra parte, solo una vez aceptada
create or replace function public.trade_request_contact(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
    from public.trade_request r
    join auth.users u
      on u.id = case when r."ownerId" = auth.uid() then r."requesterId" else r."ownerId" end
   where r.id = p_id
     and (auth.uid() = r."requesterId" or auth.uid() = r."ownerId")
     and r.status in ('accepted', 'completed');
$$;

revoke execute on function public.trade_request_create(uuid, text, text, jsonb) from public, anon;
revoke execute on function public.trade_request_respond(uuid, text, text)       from public, anon;
revoke execute on function public.trade_request_cancel(uuid)                    from public, anon;
revoke execute on function public.trade_request_complete(uuid)                  from public, anon;
revoke execute on function public.trade_request_mark_seen(uuid)                 from public, anon;
revoke execute on function public.trade_request_contact(uuid)                   from public, anon;
grant execute on function public.trade_request_create(uuid, text, text, jsonb) to authenticated;
grant execute on function public.trade_request_respond(uuid, text, text)       to authenticated;
grant execute on function public.trade_request_cancel(uuid)                    to authenticated;
grant execute on function public.trade_request_complete(uuid)                  to authenticated;
grant execute on function public.trade_request_mark_seen(uuid)                 to authenticated;
grant execute on function public.trade_request_contact(uuid)                   to authenticated;

-- 5. Avisos en vivo (Realtime respeta la RLS de lectura)
alter publication supabase_realtime add table public.trade_request;

-- 6. Permiso para pedir: se concede a los usuarios que ya existen
insert into public.user_permission ("userId", permission)
select id, 'trade.request' from auth.users
on conflict do nothing;

-- 7. Recuento para Admin → Base de datos
create or replace function public.db_table_counts()
returns table (name text, rows bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el administrador puede consultar la base de datos'
      using errcode = '42501';
  end if;

  return query
              select 'euro', count(*) from public.euro
    union all select 'owner', count(*) from public.owner
    union all select 'euro_ownership', count(*) from public.euro_ownership
    union all select 'peseta_type', count(*) from public.peseta_type
    union all select 'peseta', count(*) from public.peseta
    union all select 'country_location', count(*) from public.country_location
    union all select 'user_permission', count(*) from public.user_permission
    union all select 'guest_permission', count(*) from public.guest_permission
    union all select 'access_visit', count(*) from public.access_visit
    union all select 'access_event', count(*) from public.access_event
    union all select 'numista_usage', count(*) from public.numista_usage
    union all select 'trade_request', count(*) from public.trade_request
    union all select 'trade_request_item', count(*) from public.trade_request_item
    union all select 'auth_users', count(*) from auth.users;
end;
$$;

revoke execute on function public.db_table_counts() from public, anon;
grant execute on function public.db_table_counts() to authenticated;
