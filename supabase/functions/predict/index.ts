import { DISEASES } from "../_shared/diseases.ts";

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
      const diseaseDescriptions = diseases
        .map((id) => {
          const disease = DISEASES.find(item => item.id === id);
          return disease ? `${disease.name} (${disease.concerns})` : id;
        })
        .join(", ");
      diseasePrompt = `\n\n사용자는 다음 질병을 가지고 있습니다: ${diseaseDescriptions}\n이 질환들을 고려해서 이 음식이 얼마나 위험한지 평가해주세요.`;
    } else {
      diseasePrompt = "\n\n사용자는 특별한 질병이 없습니다. 일반적인 건강 측면에서 평가해주세요.";
    }

    const prompt = `이 이미지에 있는 음식을 아래 리스트에서 찾아주세요.

**음식 리스트 (반드시 이 중 하나만 선택):**
- 된장찌개
- 치킨
- 커피

**중요:** 리스트에 정확히 일치하는 음식이 없으면 반드시 '해당 사항 없음'이라고만 답하세요.${diseasePrompt}

**출력 형식 (정확히 두 줄만, 다른 텍스트 절대 금지):**
음식: <음식 이름 또는 '해당 사항 없음'>
위험도: 안전|주의|위험 - 이유

**규칙:**
1) 첫 줄: "음식: " 뒤에 리스트의 정확한 음식 이름 하나 또는 '해당 사항 없음'만 쓴다. "1줄:", "첫째 줄:" 같은 텍스트는 절대 쓰지 않는다.
2) 둘째 줄: "위험도: " 뒤에 안전/주의/위험 중 하나와 " - " 뒤에 이유를 쓴다. "2줄:", "둘째 줄:" 같은 텍스트는 절대 쓰지 않는다.
3) 다른 줄이나 설명은 추가하지 않는다.`;

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

    // 첫 번째 줄에서 음식 추출 (불필요한 텍스트 제거)
    const foodLine = lines.find((line: string) => line.includes("음식:"));
    if (foodLine) {
      food = foodLine
        .replace("음식:", "")
        .replace(/^\d+줄:\s*/i, "") // "1줄:", "2줄:" 등 제거
        .replace(/^첫.*줄:\s*/i, "") // "첫 줄:", "첫째 줄:" 등 제거
        .trim();
    }

    // 두 번째 줄에서 위험도 추출 (불필요한 텍스트 제거)
    const riskLine = lines.find((line: string) => line.includes("위험도:"));
    if (riskLine) {
      const riskPart = riskLine
        .replace("위험도:", "")
        .replace(/^\d+줄:\s*/i, "") // "1줄:", "2줄:" 등 제거
        .replace(/^둘.*줄:\s*/i, "") // "둘째 줄:" 등 제거
        .trim();
      const dashIndex = riskPart.indexOf("-");
      if (dashIndex !== -1) {
        riskLevel = riskPart.substring(0, dashIndex).trim();
        riskComment = riskPart.substring(dashIndex + 1).trim();
      } else {
        riskLevel = riskPart;
      }
    }

    if (!food) {
      console.error("음식 이름을 파싱할 수 없습니다.");
      return new Response(JSON.stringify({ detail: "OpenAI 응답에서 결과를 찾지 못했습니다." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("분석 완료:", { food, riskLevel, riskComment });

    return new Response(
      JSON.stringify({
        food,
        risk_level: riskLevel,
        risk_comment: riskComment,
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
