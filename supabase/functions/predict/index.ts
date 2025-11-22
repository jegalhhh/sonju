const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DISEASE_INFO: Record<string, { name: string; concerns: string }> = {
  htn: { name: "고혈압", concerns: "나트륨 함량이 높으면 위험" },
  dm: { name: "당뇨병", concerns: "당분과 탄수화물 함량이 높으면 위험" },
  dyslipidemia: { name: "고지혈증", concerns: "포화지방과 콜레스테롤이 높으면 위험" },
  obesity: { name: "비만", concerns: "칼로리와 지방이 높으면 위험" },
  kidney: { name: "신장질환", concerns: "나트륨, 칼륨, 인이 높으면 위험" },
  liver: { name: "간질환", concerns: "지방과 알코올이 많으면 위험" },
  gout: { name: "통풍", concerns: "퓨린 함량이 높으면 위험" },
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
          const info = DISEASE_INFO[id];
          return info ? `${info.name} (${info.concerns})` : id;
        })
        .join(", ");
      diseasePrompt = `\n\n사용자는 다음 질병을 가지고 있습니다: ${diseaseDescriptions}\n이 질환들을 고려해서 이 음식이 얼마나 위험한지 평가해주세요.`;
    } else {
      diseasePrompt = "\n\n사용자는 특별한 질병이 없습니다. 일반적인 건강 측면에서 평가해주세요.";
    }

    const prompt = `이 이미지에 있는 음식을 아래 리스트에서 찾아주세요:
된장찌개, 비빔밥, 불고기, 삼겹살, 갈비, 치킨, 피자, 햄버거, 라면, 떡볶이, 김밥, 초밥, 파스타, 스테이크, 샐러드, 커피, 케이크

리스트에 없으면 '해당 사항 없음'이라고 답해주세요.${diseasePrompt}

출력 형식 (반드시 두 줄만):
음식: <음식 이름 또는 '해당 사항 없음'>
위험도: 안전|주의|위험 - 이유

규칙:
1) 첫 줄에는 음식 리스트 중 하나 또는 '해당 사항 없음'만 쓴다.
2) 둘째 줄에는 '위험도: 안전|주의|위험 - 이유' 형식으로만 작성.
3) 다른 줄이나 설명은 추가로 쓰지 않는다.`;

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

    // 첫 번째 줄에서 음식 추출
    const foodLine = lines.find((line: string) => line.includes("음식:"));
    if (foodLine) {
      food = foodLine.replace("음식:", "").trim();
    }

    // 두 번째 줄에서 위험도 추출
    const riskLine = lines.find((line: string) => line.includes("위험도:"));
    if (riskLine) {
      const riskPart = riskLine.replace("위험도:", "").trim();
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
