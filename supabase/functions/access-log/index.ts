import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { parseUserAgent } from './user-agent.ts';

// Registro de accesos. Pública (verify_jwt = false): la llaman también los visitantes sin sesión.
//   POST /visit → crea la visita y devuelve { visitId }
//   POST /event → { visitId, type, path?, detail? } añade un evento (página, login, logout, login fallido)
//   POST /ping  → { visitId } solo actualiza lastSeenAt (llega por sendBeacon, sin cabeceras)
// Solo esta función escribe en access_visit / access_event (service_role); el admin las lee.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const EVENT_TYPES = new Set(['page', 'login', 'logout', 'login_failed']);
const MAX_EVENTS_PER_VISIT = 500;
const MAX_VISIT_AGE_MS = 24 * 60 * 60 * 1000;
const GEO_TIMEOUT_MS = 1500;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Texto recortado o null: nada de lo que manda el navegador entra sin límite. */
function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v.slice(0, max) : null;
}

/** Cuerpo JSON: sendBeacon lo manda como text/plain, así que se lee como texto. */
async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(await req.text());
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null;
}

function isPrivateIp(ip: string): boolean {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i.test(ip);
}

type Geo = { country: string | null; countryCode: string | null; region: string | null; city: string | null };

/** País, región y ciudad aproximados con ipapi.co. Si tarda o falla, la visita se guarda sin ubicación. */
async function geolocate(ip: string | null): Promise<Geo> {
  const empty = { country: null, countryCode: null, region: null, city: null };
  if (!ip || isPrivateIp(ip)) return empty;
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
    });
    if (!res.ok) return empty;
    const g = await res.json();
    if (g?.error) return empty;
    return {
      country: clip(g.country_name, 80),
      countryCode: clip(g.country_code, 2),
      region: clip(g.region, 80),
      city: clip(g.city, 80),
    };
  } catch {
    return empty;
  }
}

type SessionUser = { id: string; name: string | null };

/** Usuario del token, si lo hay, con el nombre de su colección › su nombre › su email. */
async function sessionUser(client: SupabaseClient, req: Request): Promise<SessionUser | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const u = data.user;
  const { data: owner } = await client.from('owner').select('name').eq('id', u.id).maybeSingle();
  const fullName = u.user_metadata?.['full_name'];
  const name =
    (owner?.name as string | undefined) ||
    (typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null) ||
    u.email ||
    null;
  return { id: u.id, name };
}

type VisitRow = { id: string; startedAt: string; userId: string | null };

/** Visita existente y aún vigente (menos de 24 h); si no, null. */
async function findVisit(client: SupabaseClient, visitId: unknown): Promise<VisitRow | null> {
  if (typeof visitId !== 'string' || !UUID.test(visitId)) return null;
  const { data } = await client
    .from('access_visit')
    .select('id, "startedAt", "userId"')
    .eq('id', visitId)
    .maybeSingle();
  if (!data) return null;
  if (Date.now() - new Date(data.startedAt).getTime() > MAX_VISIT_AGE_MS) return null;
  return data as VisitRow;
}

async function createVisit(client: SupabaseClient, req: Request) {
  const body = await readBody(req);
  const userAgent = clip(req.headers.get('user-agent'), 500) ?? '';
  const ip = clientIp(req);
  const [geo, user] = await Promise.all([geolocate(ip), sessionUser(client, req)]);

  const { data, error } = await client
    .from('access_visit')
    .insert({
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      ip,
      ...geo,
      userAgent,
      ...parseUserAgent(userAgent, body.touch === true),
      screen: clip(body.screen, 20),
      language: clip(body.language, 20),
      appLang: clip(body.appLang, 5),
      referrer: clip(body.referrer, 300),
      landingPath: clip(body.path, 300),
      appVersion: clip(body.appVersion, 20),
    })
    .select('id')
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ visitId: data.id });
}

async function addEvent(client: SupabaseClient, req: Request) {
  const body = await readBody(req);
  const type = body.type;
  if (typeof type !== 'string' || !EVENT_TYPES.has(type)) return json({ error: 'Tipo no válido' }, 400);

  const visit = await findVisit(client, body.visitId);
  // 410: el front empieza una visita nueva y vuelve a mandar el evento
  if (!visit) return json({ error: 'Visita no encontrada o caducada' }, 410);

  const { count } = await client
    .from('access_event')
    .select('id', { count: 'exact', head: true })
    .eq('visitId', visit.id);
  if ((count ?? 0) >= MAX_EVENTS_PER_VISIT) return json({ error: 'Demasiados eventos' }, 429);

  const user = await sessionUser(client, req);
  // El logout llega ya sin sesión: se atribuye al usuario de la visita
  const userId = user?.id ?? (type === 'logout' ? visit.userId : null);

  const { error } = await client.from('access_event').insert({
    visitId: visit.id,
    type,
    path: clip(body.path, 300),
    userId,
    detail: clip(body.detail, 200),
  });
  if (error) return json({ error: error.message }, 500);

  const update: Record<string, unknown> = { lastSeenAt: new Date().toISOString() };
  // La visita queda a nombre del primer usuario que inicia sesión en ella
  if (user && !visit.userId) {
    update.userId = user.id;
    update.userName = user.name;
  }
  await client.from('access_visit').update(update).eq('id', visit.id);
  return json({ ok: true });
}

async function ping(client: SupabaseClient, req: Request) {
  const visit = await findVisit(client, (await readBody(req)).visitId);
  if (!visit) return json({ error: 'Visita no encontrada o caducada' }, 410);
  await client.from('access_visit').update({ lastSeenAt: new Date().toISOString() }).eq('id', visit.id);
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const action = new URL(req.url).pathname.split('/').pop();

  try {
    switch (action) {
      case 'visit':
        return await createVisit(client, req);
      case 'event':
        return await addEvent(client, req);
      case 'ping':
        return await ping(client, req);
      default:
        return json({ error: 'Ruta no encontrada' }, 404);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error inesperado' }, 500);
  }
});
