import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Debe coincidir con PERMISSIONS (coins-ddlp-front/src/app/shared/constants/permissions.const.ts)
const VALID_PERMISSIONS = new Set([
  'euros.units.editOwn',
  'euros.units.editAny',
  'euros.catalog.edit',
  'euros.delete',
  'tools.addEuro',
  'tools.addYear',
  'location.create',
  'location.update',
  'location.delete',
  'location.viewInLists',
  'export.excel',
  'collection.switch',
  'section.estadisticas',
  'section.ubicacion',
  'section.pesetas',
  'section.conmemorativas',
  'numista.quotaView',
]);

// Solo de consulta: el Invitado no puede escribir. Debe coincidir con GUEST_PERMISSIONS del front
const GUEST_PERMISSIONS = new Set([
  'location.viewInLists',
  'export.excel',
  'collection.switch',
  'section.estadisticas',
  'section.ubicacion',
  'section.pesetas',
  'section.conmemorativas',
  'numista.quotaView',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

/** Colección propia del usuario: si es la por defecto y cuántas monedas tiene guardadas. */
type UserCollection = { isDefault: boolean; units: number } | null;

function mapUser(u: AuthUser, permissions: string[] = [], collection: UserCollection = null) {
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: u.user_metadata?.['full_name'] ?? null,
    role: u.app_metadata?.['role'] ?? null,
    permissions,
    collection,
  };
}

/** Nombre visible de la colección: el del usuario o, si no tiene, su email. */
function collectionName(u: AuthUser): string {
  const name = u.user_metadata?.['full_name'];
  return typeof name === 'string' && name.trim() ? name.trim() : (u.email ?? u.id);
}

/** Filtra claves desconocidas o repetidas. */
function cleanPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(value.filter((p): p is string => typeof p === 'string' && VALID_PERMISSIONS.has(p))),
  ];
}

/** Sustituye los permisos de un usuario por los indicados. */
async function setUserPermissions(client: SupabaseClient, uid: string, permissions: string[]) {
  const del = await client.from('user_permission').delete().eq('userId', uid);
  if (del.error) return del.error;
  if (permissions.length === 0) return null;
  const ins = await client
    .from('user_permission')
    .insert(permissions.map((permission) => ({ userId: uid, permission })));
  return ins.error;
}

/** Colecciones de los usuarios indicados (todas si no se indican). */
async function getCollections(
  client: SupabaseClient,
  uid?: string,
): Promise<Map<string, UserCollection>> {
  let ownersQuery = client.from('owner').select('id, "isDefault"');
  let unitsQuery = client.from('euro_ownership').select('ownerId').gt('uds', 0);
  if (uid) {
    ownersQuery = ownersQuery.eq('id', uid);
    unitsQuery = unitsQuery.eq('ownerId', uid);
  }
  const [owners, units] = await Promise.all([ownersQuery, unitsQuery]);
  if (owners.error) throw owners.error;
  if (units.error) throw units.error;
  const counts = new Map<string, number>();
  for (const r of units.data as { ownerId: string }[]) {
    counts.set(r.ownerId, (counts.get(r.ownerId) ?? 0) + 1);
  }
  const result = new Map<string, UserCollection>();
  for (const o of owners.data as { id: string; isDefault: boolean }[]) {
    result.set(o.id, { isDefault: o.isDefault, units: counts.get(o.id) ?? 0 });
  }
  return result;
}

/**
 * Da, actualiza o quita la colección propia de un usuario. `hasCollection`
 * `undefined` deja la colección como está (solo se actualiza el nombre).
 */
async function setCollection(
  client: SupabaseClient,
  user: AuthUser,
  hasCollection: unknown,
  isDefault: unknown,
) {
  const current = (await getCollections(client, user.id)).get(user.id) ?? null;
  const wants = typeof hasCollection === 'boolean' ? hasCollection : current !== null;

  if (!wants) {
    if (!current) return null;
    if (current.isDefault) return new Error('No se puede quitar la colección por defecto');
    const del = await client.from('owner').delete().eq('id', user.id);
    return del.error;
  }

  // Solo puede haber una por defecto: se desmarca la anterior antes
  const makeDefault = isDefault === true && !current?.isDefault;
  if (makeDefault) {
    const unset = await client.from('owner').update({ isDefault: false }).eq('isDefault', true);
    if (unset.error) return unset.error;
  }
  const up = await client.from('owner').upsert({
    id: user.id,
    name: collectionName(user),
    isDefault: makeDefault || (current?.isDefault ?? false),
  });
  return up.error;
}

async function getUserPermissions(client: SupabaseClient, uid: string): Promise<string[]> {
  const { data } = await client.from('user_permission').select('permission').eq('userId', uid);
  return (data ?? []).map((r: { permission: string }) => r.permission);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verificar JWT y rol admin
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'No autorizado' }, 401);

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.app_metadata?.role !== 'admin') return json({ error: 'Acceso denegado' }, 403);
  } catch {
    return json({ error: 'Token inválido' }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Ruta tras /admin-users: '', 'guest', ':uid' o ':uid/recovery'
  const segments = new URL(req.url).pathname.split('/').filter(Boolean);
  const base = segments.indexOf('admin-users');
  const [first, second] = segments.slice(base + 1);

  // ── Perfil Invitado ──
  if (first === 'guest') {
    if (req.method === 'GET') {
      const { data, error } = await adminClient.from('guest_permission').select('permission');
      if (error) return json({ error: error.message }, 500);
      return json({
        permissions: data.map((r: { permission: string }) => r.permission),
      });
    }
    if (req.method === 'PUT') {
      const permissions = cleanPermissions((await req.json()).permissions).filter((p) =>
        GUEST_PERMISSIONS.has(p),
      );
      const del = await adminClient.from('guest_permission').delete().neq('permission', '');
      if (del.error) return json({ error: del.error.message }, 400);
      if (permissions.length > 0) {
        const ins = await adminClient
          .from('guest_permission')
          .insert(permissions.map((permission) => ({ permission })));
        if (ins.error) return json({ error: ins.error.message }, 400);
      }
      return json({ permissions });
    }
    return json({ error: 'Método no permitido' }, 405);
  }

  const uid = first;

  // POST /:uid/recovery — enviar email de recuperación
  if (req.method === 'POST' && uid && second === 'recovery') {
    const { redirectTo } = await req.json().catch(() => ({}));
    const { data, error } = await adminClient.auth.admin.getUserById(uid);
    if (error || !data.user?.email)
      return json({ error: error?.message ?? 'Usuario sin email' }, 400);
    const res = await adminClient.auth.resetPasswordForEmail(data.user.email, {
      redirectTo: typeof redirectTo === 'string' ? redirectTo : undefined,
    });
    if (res.error) return json({ error: res.error.message }, 400);
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // GET — listar usuarios con sus permisos y su colección
  if (req.method === 'GET') {
    const { data, error } = await adminClient.auth.admin.listUsers();
    if (error) return json({ error: error.message }, 500);
    const perms = await adminClient.from('user_permission').select('userId, permission');
    if (perms.error) return json({ error: perms.error.message }, 500);
    const byUser = new Map<string, string[]>();
    for (const r of perms.data as { userId: string; permission: string }[]) {
      byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r.permission]);
    }
    let collections: Map<string, UserCollection>;
    try {
      collections = await getCollections(adminClient);
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }
    return json(
      data.users.map((u) => mapUser(u, byUser.get(u.id) ?? [], collections.get(u.id) ?? null)),
    );
  }

  // POST — crear usuario
  if (req.method === 'POST' && !uid) {
    const { email, password, displayName, role, permissions, hasCollection, isDefaultCollection } =
      await req.json();
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: displayName },
      app_metadata: { role },
      email_confirm: true,
    });
    if (error) return json({ error: error.message }, 400);
    const clean = cleanPermissions(permissions);
    const permError = await setUserPermissions(adminClient, data.user.id, clean);
    if (permError) return json({ error: permError.message }, 400);
    const colError = await setCollection(
      adminClient,
      data.user,
      hasCollection,
      isDefaultCollection,
    );
    if (colError) return json({ error: colError.message }, 400);
    const collections = await getCollections(adminClient, data.user.id);
    return json(mapUser(data.user, clean, collections.get(data.user.id) ?? null), 201);
  }

  // PATCH — editar usuario
  if (req.method === 'PATCH' && uid) {
    const { displayName, role, permissions, hasCollection, isDefaultCollection } = await req.json();
    const { data, error } = await adminClient.auth.admin.updateUserById(uid, {
      user_metadata: { full_name: displayName },
      app_metadata: { role },
    });
    if (error) return json({ error: error.message }, 400);
    if (permissions !== undefined) {
      const permError = await setUserPermissions(adminClient, uid, cleanPermissions(permissions));
      if (permError) return json({ error: permError.message }, 400);
    }
    // También sincroniza el nombre de la colección con el del usuario
    const colError = await setCollection(
      adminClient,
      data.user,
      hasCollection,
      isDefaultCollection,
    );
    if (colError) return json({ error: colError.message }, 400);
    const collections = await getCollections(adminClient, uid);
    return json(
      mapUser(data.user, await getUserPermissions(adminClient, uid), collections.get(uid) ?? null),
    );
  }

  // DELETE — eliminar usuario (sus permisos y su colección se borran en cascada)
  if (req.method === 'DELETE' && uid) {
    const collections = await getCollections(adminClient, uid);
    if (collections.get(uid)?.isDefault) {
      return json({ error: 'No se puede eliminar al dueño de la colección por defecto' }, 400);
    }
    const { error } = await adminClient.auth.admin.deleteUser(uid);
    if (error) return json({ error: error.message }, 400);
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return json({ error: 'Método no permitido' }, 405);
});
