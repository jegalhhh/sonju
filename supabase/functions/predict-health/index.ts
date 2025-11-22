const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PYTHON_API_URL = "https://health-predict-api-585909530618.asia-northeast3.run.app";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = await req.json();
    console.log("Received input from client:", input);

    // Validate input
    const requiredFields = [
      "gender",
      "age",
      "energy",
      "protein",
      "fat",
      "carbs",
      "sugar",
      "sodium_mg",
      "calcium_mg",
      "vitaminc_mg",
    ];
    for (const field of requiredFields) {
      if (input[field] === undefined || input[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Call Python API
    console.log(`Calling Python API: ${PYTHON_API_URL}/predict`);
    const response = await fetch(`${PYTHON_API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Python API error: ${response.status} - ${errorText}`);
      
      // Handle specific error codes
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error(`Python API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Python API response:", data);

    // Return the response from Python API directly
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Prediction error:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류입니다.";
    
    return new Response(
      JSON.stringify({ 
        error: "예측 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
