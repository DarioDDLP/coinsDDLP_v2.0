-- Habilita Row-Level Security en numista_usage.
-- Esta tabla es metadata interna (contadores de uso de la API de Numista).
-- Solo usuarios autenticados pueden leerla; las escrituras vienen de la Edge
-- Function numista-proxy con service_role, que ignora RLS.

alter table public.numista_usage enable row level security;

create policy "Lectura autenticados" on public.numista_usage
  for select to authenticated using (true);
