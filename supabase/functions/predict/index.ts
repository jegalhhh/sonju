import { DISEASES_MAP } from "../_shared/diseases.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
      return new Response(JSON.stringify({ detail: "서버 설정 오류입니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const diseases = formData.getAll("diseases") as string[];

    if (!file || !(file instanceof File)) {
      console.log("파일이 업로드되지 않았습니다.");
      return new Response(JSON.stringify({ detail: "이미지 파일을 업로드해주세요." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`파일 수신: ${file.name}, 크기: ${file.size} bytes`);
    console.log(`선택된 질병: ${diseases.join(", ")}`);

    // 이미지를 base64로 인코딩
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;

    // 질병 정보 프롬프트 생성
    let diseasePrompt = "";
    if (diseases.length > 0) {
      const diseaseNames = diseases
        .map((id) => {
          const disease = DISEASES_MAP.get(id);
          return disease ? disease.name : id;
        })
        .join(", ");
      
      const diseaseDetails = diseases
        .map((id) => {
          const disease = DISEASES_MAP.get(id);
          return disease ? `${disease.name}: ${disease.description}` : id;
        })
        .join("; ");
      
      diseasePrompt = `\n\n사용자는 다음과 같은 질환을 가지고 있습니다: ${diseaseNames}. 각 질환에 대한 요약 설명은 다음과 같습니다: ${diseaseDetails}\n\n이 질환들을 고려하여 음식의 건강 위험도를 평가하세요.`;
    } else {
      diseasePrompt = "\n\n사용자에게 알려진 만성 질환 정보는 없습니다.";
    }

    const prompt = `이 음식 사진을 보고 아래 음식 리스트 중 하나의 이름을 고르거나, 관련이 없으면 '해당 사항 없음'을 선택해.

음식 리스트:
1. 된장찌개
2. 치킨
3. 커피

${diseasePrompt}

출력 형식은 반드시 아래 예시처럼 세 줄만 사용해.
예시:
음식: 된장찌개
위험도: 주의 - 고혈압 환자의 경우 나트륨 함량이 높을 수 있습니다.
칼로리: 약 550 kcal

규칙:
1) 첫 줄에는 위 음식 리스트 중 하나의 이름 또는 '해당 사항 없음'만 쓴다.
2) 둘째 줄에는 '위험도: 안전|주의|위험 - 이유' 형식으로 쓴다.
3) 셋째 줄에는 '칼로리: 대략적인 kcal 값'을 한 줄로 쓴다.
4) 다른 줄이나 설명은 추가로 쓰지 마라.`;

    console.log("OpenAI Vision API 호출 시작...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "너는 영양사이자 의사처럼 사용자의 질병 상태를 고려해 음식을 평가하는 도우미야.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API 오류:", openaiResponse.status, errorText);
      return new Response(JSON.stringify({ detail: "AI 분석 중 오류가 발생했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const rawText = openaiData.choices?.[0]?.message?.content?.trim();
    console.log("OpenAI 응답:", rawText);

    if (!rawText) {
      console.error("OpenAI 응답에서 내용을 찾을 수 없습니다.");
      return new Response(JSON.stringify({ detail: "OpenAI 응답에서 결과를 찾지 못했습니다." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 응답 파싱
    const lines = rawText.split("\n").filter((line: string) => line.trim());

    let food = "";
    let riskLevel = "";
    let riskComment = "";
    let calories = "";

    // 첫 번째 줄에서 음식 추출
    const foodLine = lines.find((line: string) => line.includes("음식:"));
    if (foodLine) {
      food = foodLine
        .replace("음식:", "")
        .replace(/^\d+줄:\s*/i, "")
        .replace(/^첫.*줄:\s*/i, "")
        .trim();
    }

    // 두 번째 줄에서 위험도 추출
    const riskLine = lines.find((line: string) => line.includes("위험도:"));
    if (riskLine) {
      const riskPart = riskLine
        .replace("위험도:", "")
        .replace(/^\d+줄:\s*/i, "")
        .replace(/^둘.*줄:\s*/i, "")
        .trim();
      const dashIndex = riskPart.indexOf("-");
      if (dashIndex !== -1) {
        riskLevel = riskPart.substring(0, dashIndex).trim();
        riskComment = riskPart.substring(dashIndex + 1).trim();
      } else {
        riskLevel = riskPart;
      }
    }

    // 세 번째 줄에서 칼로리 추출
    const caloriesLine = lines.find((line: string) => line.includes("칼로리:"));
    if (caloriesLine) {
      calories = caloriesLine
        .replace("칼로리:", "")
        .replace(/^\d+줄:\s*/i, "")
        .replace(/^셋.*줄:\s*/i, "")
        .trim();
    }

    if (!food) {
      console.error("음식 이름을 파싱할 수 없습니다.");
      return new Response(JSON.stringify({ detail: "OpenAI 응답에서 결과를 찾지 못했습니다." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("분석 완료:", { food, riskLevel, riskComment, calories });

    return new Response(
      JSON.stringify({
        food,
        risk_level: riskLevel,
        risk_comment: riskComment,
        calories,
        raw: rawText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("서버 오류:", err);
    const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
    return new Response(JSON.stringify({ detail: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
