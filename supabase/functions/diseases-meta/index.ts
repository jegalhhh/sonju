import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const diseases = [
      { id: "htn", name: "고혈압", description: "혈압이 정상보다 높은 상태" },
      { id: "dm", name: "당뇨병", description: "혈당이 정상보다 높은 상태" },
      { id: "dyslipidemia", name: "고지혈증", description: "혈중 지질 수치가 높은 상태" },
      { id: "obesity", name: "비만", description: "체질량지수가 높은 상태" },
      { id: "kidney", name: "신장질환", description: "신장 기능이 저하된 상태" },
      { id: "liver", name: "간질환", description: "간 기능이 저하된 상태" },
      { id: "gout", name: "통풍", description: "요산이 과다하게 축적되는 상태" },
    ];

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
