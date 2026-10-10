-- ─────────────────────────────────────────────────────────────────────────────
-- Colección propia por usuario
--
--   · `owner` deja de tener dueños fijos: el admin da o quita la colección a
--     cualquier usuario desde la Edge Function `admin-users` (service_role)
--   · `isDefault` → colección que ven los visitantes y quien no puede cambiarla
--   · Borrar un usuario borra su colección y, en cascada, su `euro_ownership`
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Colección por defecto (solo una)
alter table public.owner add column if not exists "isDefault" boolean not null default false;

create unique index if not exists owner_single_default
  on public.owner ("isDefault") where "isDefault";

update public.owner set "isDefault" = true where id = 'e787ff06-0da9-43e8-9dc5-a16e37cb4a33';

-- 2. El slug ya no se usa: el front identifica las colecciones por id
alter table public.owner drop column if exists slug;

-- 3. Cada colección pertenece a un usuario
alter table public.owner
  add constraint owner_user_fk foreign key (id) references auth.users(id) on delete cascade;
