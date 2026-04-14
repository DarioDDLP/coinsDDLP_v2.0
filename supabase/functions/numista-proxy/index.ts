import "@supabase/functions-js/edge-runtime.d.ts"

const NUMISTA_API_URL = 'https://api.numista.com/api/v3/types/';
const NUMISTA_API_KEY = Deno.env.get('NUMISTA_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
