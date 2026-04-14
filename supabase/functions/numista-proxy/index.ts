import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const NUMISTA_API_URL = 'https://api.numista.com/api/v3/types/';
const NUMISTA_API_KEY = Deno.env.get('NUMISTA_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const MONTHLY_LIMIT = 2000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'X-Numista-Remaining',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const idNum = url.searchParams.get('idNum');

  if (!idNum) {
    return new Response(
      JSON.stringify({ error: 'idNum es requerido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch(`${NUMISTA_API_URL}${idNum}?lang=es`, {
    headers: { 'Numista-API-Key': NUMISTA_API_KEY },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: `Numista respondió con ${response.status}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Registrar la llamada
  const { error: logError } = await supabase.from('numista_usage').insert({ idnum: idNum });
  if (logError) console.error('Error registrando uso Numista:', logError.message);

  // Contar llamadas del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('numista_usage')
    .select('*', { count: 'exact', head: true })
    .gte('called_at', startOfMonth.toISOString());

  const remaining = MONTHLY_LIMIT - (count ?? 0);

  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Numista-Remaining': String(remaining),
      }
    }
  );
});
