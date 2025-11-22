import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopFactor {
  feature: string;
  value: number;
  impact: "increase" | "decrease";
}

interface AdviceRequest {
  disease: string;
  risk: number;
  top_factors: TopFactor[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { disease, risk, top_factors }: AdviceRequest = await req.json();

    // risk < 0.4이면 조언 생성하지 않음
    if (risk < 0.4) {
      return new Response(
        JSON.stringify({ advice: "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const topFactorsJson = JSON.stringify(top_factors, null, 2);

    const prompt = `역할: 너는 한국어로 답하는 전문 영양사 + 가정의학과 전문의이다.

아래는 어떤 사용자의 건강 위험도 예측 결과 중, 한 질환에 대한 정보이다.

- 질환명: ${disease}
- 예측 위험도 (0~1): ${risk}
- 중요 요인 (SHAP Top Factors, risk >= 0.4 인 경우만 제공됨):
  ${topFactorsJson}

설명:
- value가 클수록 해당 피처가 이번 예측에서 중요했다는 의미이다.
- impact = "increase" 는 이 섭취 패턴이 해당 질환 위험도를 "올리는 방향"으로 작용했다는 뜻이다.
- impact = "decrease" 는 이 섭취 패턴이 위험도를 "낮추는 방향"으로 작용했다는 뜻이다.

요청 사항:
1. 사용자가 보기 쉽게, **짧고 명확한 한글 문장 2~4개**로만 답해라.
2. "현재 ${disease} 위험도가 어느 정도인지"를 한 문장으로 먼저 요약해라. (예: "현재 당뇨병 위험도는 비교적 높은 편입니다.")
3. 이어서, top_factors를 기반으로 **구체적인 식단/생활습관 추천 2~3가지**를 써라.
   - impact = "increase" 인 피처에 대해서는: "이것을 줄이거나 조절하라"는 방향의 권고
   - impact = "decrease" 인 피처에 대해서는: "이 패턴을 유지하거나 조금 더 강화해도 좋다"는 방향의 권고
4. 숫자/용어는 일반인 기준으로 이해하기 쉽게 설명하되, 너무 장황하게 쓰지 마라.
5. "칼로리 2,000kcal" 같은 구체 숫자가 필요하면, top_factors와 질환 특성을 상식적인 범위 안에서 추론해서 사용해도 된다.
6. 반말/명령조가 아니라, 존댓말과 권유형 어조("~하시는 게 좋겠습니다")로 작성해라.

주의:
- JSON 그대로를 다시 출력하지 마라.
- bullet 포인트를 쓴다면 2~3개까지만 사용해라.
- 의료 진단이 아니라 "생활습관/식습관 조언"이라는 뉘앙스를 유지해라.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 한국어로 답하는 전문 영양사이자 가정의학과 전문의입니다." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const advice = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ advice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate advice error:", error);
    return new Response(
      JSON.stringify({ 
        error: "조언 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
