import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function mapUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) {
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: u.user_metadata?.['full_name'] ?? null,
    role: u.app_metadata?.['role'] ?? null,
  };
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

  const url = new URL(req.url);
  const uid = url.pathname.split('/').filter(Boolean).pop();

  // GET — listar usuarios
  if (req.method === 'GET') {
    const { data, error } = await adminClient.auth.admin.listUsers();
    if (error) return json({ error: error.message }, 500);
    return json(data.users.map(mapUser));
  }

  // POST — crear usuario
  if (req.method === 'POST') {
    const { email, password, displayName, role } = await req.json();
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: displayName },
      app_metadata: { role },
      email_confirm: true,
    });
    if (error) return json({ error: error.message }, 400);
    return json(mapUser(data.user), 201);
  }

  // PATCH — editar usuario
  if (req.method === 'PATCH' && uid) {
    const { displayName, role } = await req.json();
    const { data, error } = await adminClient.auth.admin.updateUserById(uid, {
      user_metadata: { full_name: displayName },
      app_metadata: { role },
    });
    if (error) return json({ error: error.message }, 400);
    return json(mapUser(data.user));
  }

  // DELETE — eliminar usuario
  if (req.method === 'DELETE' && uid) {
    const { error } = await adminClient.auth.admin.deleteUser(uid);
    if (error) return json({ error: error.message }, 400);
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return json({ error: 'Método no permitido' }, 405);
});
