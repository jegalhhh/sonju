import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DISEASES } from "../_shared/diseases.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const diseases = DISEASES.map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));

    return new Response(
      JSON.stringify({ items: diseases }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('diseases-meta error:', error);
    return new Response(
      JSON.stringify({ detail: error.message || '알 수 없는 오류입니다.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
