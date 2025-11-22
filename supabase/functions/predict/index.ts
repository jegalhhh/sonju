// AI 음식 인식 Edge Function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
      return new Response(
        JSON.stringify({ detail: "서버 설정 오류입니다." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // FormData에서 파일 가져오기
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      console.log("파일이 업로드되지 않았습니다.");
      return new Response(
        JSON.stringify({ detail: "이미지 파일을 업로드해주세요." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`파일 수신: ${file.name}, 크기: ${file.size} bytes`);

    // 파일을 ArrayBuffer로 읽고 base64로 인코딩
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;

    console.log("OpenAI Vision API 호출 시작...");

    // OpenAI Vision API 호출
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `이 음식 사진을 보고 아래 음식 리스트 중 하나의 이름만 한국어로 출력해.
출력 형식은 예시처럼 음식 이름만 한 줄로 써.
예시: 된장찌개

음식 리스트:
1. 된장찌개
2. 치킨
3. 커피
4. 김치찌개
5. 불고기
6. 비빔밥
7. 삼겹살
8. 김밥
9. 라면
10. 떡볶이
11. 순대
12. 피자
13. 햄버거
14. 스테이크
15. 파스타
16. 샐러드
17. 초밥
18. 우동
19. 카레
20. 만두

규칙:
1) 반드시 위 음식 리스트 중 하나의 이름만 그대로 출력하고, 다른 단어/기호/설명은 쓰지 마.
2) 사진 속 음식이 위 리스트와 전혀 관련이 없으면 '해당 사항 없음'만 그대로 출력해.`,
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
          max_tokens: 50,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API 오류:", openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ detail: "AI 분석 중 오류가 발생했습니다." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI 응답 수신:", JSON.stringify(openaiData, null, 2));

    const foodName = openaiData.choices?.[0]?.message?.content?.trim();

    if (!foodName) {
      console.error("OpenAI 응답에서 음식 이름을 찾을 수 없습니다.");
      return new Response(
        JSON.stringify({
          detail: "OpenAI 응답에서 결과를 찾지 못했습니다.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("분석 완료:", foodName);

    return new Response(JSON.stringify({ food: foodName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("서버 오류:", err);
    const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
    return new Response(JSON.stringify({ detail: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
