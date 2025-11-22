import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import * as ort from "npm:onnxruntime-web@1.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScalerParams {
  mean: number[];
  scale: number[];
}

interface ModelCache {
  dm: ort.InferenceSession | null;
  ht: ort.InferenceSession | null;
  hlip: ort.InferenceSession | null;
  osas: ort.InferenceSession | null;
  scaler: ScalerParams | null;
}

// Global cache for models
const modelCache: ModelCache = {
  dm: null,
  ht: null,
  hlip: null,
  osas: null,
  scaler: null,
};

async function loadModels(): Promise<void> {
  if (modelCache.dm && modelCache.ht && modelCache.hlip && modelCache.osas && modelCache.scaler) {
    console.log("Models already loaded, using cache");
    return;
  }

  console.log("Loading ONNX models from Storage...");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL not configured");
  }

  try {
    // Load scaler parameters from Storage
    const scalerUrl = `${SUPABASE_URL}/storage/v1/object/public/ml-models/scaler.json`;
    console.log("Loading scaler from:", scalerUrl);
    const scalerResponse = await fetch(scalerUrl);
    if (!scalerResponse.ok) {
      throw new Error(`Failed to load scaler: ${scalerResponse.status} ${scalerResponse.statusText}`);
    }
    const scalerText = await scalerResponse.text();
    modelCache.scaler = JSON.parse(scalerText);
    console.log("Scaler loaded");

    // Load ONNX models from Storage
    const modelNames = ["dm", "ht", "hlip", "osas"];
    for (const name of modelNames) {
      const modelUrl = `${SUPABASE_URL}/storage/v1/object/public/ml-models/model_${name}.onnx`;
      console.log(`Loading model ${name} from:`, modelUrl);
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error(`Failed to load model ${name}: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      modelCache[name as keyof Omit<ModelCache, "scaler">] = await ort.InferenceSession.create(new Uint8Array(arrayBuffer));
      console.log(`Model ${name} loaded`);
    }

    console.log("All models loaded successfully");
  } catch (error) {
    console.error("Error loading models:", error);
    throw error;
  }
}

function preprocessInput(input: {
  gender: number;
  age: number;
  energy: number;
  protein: number;
  fat: number;
  carbs: number;
  sugar: number;
  sodium_mg: number;
  calcium_mg: number;
  vitaminc_mg: number;
}): Float32Array {
  if (!modelCache.scaler) {
    throw new Error("Scaler not loaded");
  }

  // Convert mg to g and create feature array
  const features = [
    input.gender,
    input.age,
    input.energy,
    input.protein,
    input.fat,
    input.carbs,
    input.sugar,
    input.sodium_mg / 1000, // mg → g
    input.calcium_mg / 1000, // mg → g
    input.vitaminc_mg / 1000, // mg → g
  ];

  // Apply StandardScaler
  const scaled = features.map((val, idx) => (val - modelCache.scaler!.mean[idx]) / modelCache.scaler!.scale[idx]);

  return new Float32Array(scaled);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load models if not already loaded
    await loadModels();

    const input = await req.json();
    console.log("Received input:", input);

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

    // Preprocess input
    const scaledFeatures = preprocessInput(input);
    console.log("Preprocessed features:", scaledFeatures);

    // Step 1: Diabetes prediction
    const dmTensor = new ort.Tensor("float32", scaledFeatures, [1, 10]);
    const dmResult = await modelCache.dm!.run({ float_input: dmTensor });
    const pred_dm = Array.isArray(dmResult.probabilities.data) 
      ? dmResult.probabilities.data[1] 
      : dmResult.probabilities.data instanceof Float32Array
      ? dmResult.probabilities.data[1]
      : 0;
    console.log("DM prediction:", pred_dm);

    // Step 2: Hypertension prediction (add pred_dm)
    const htFeatures = new Float32Array([...scaledFeatures, pred_dm]);
    const htTensor = new ort.Tensor("float32", htFeatures, [1, 11]);
    const htResult = await modelCache.ht!.run({ float_input: htTensor });
    const pred_ht = Array.isArray(htResult.probabilities.data)
      ? htResult.probabilities.data[1]
      : htResult.probabilities.data instanceof Float32Array
      ? htResult.probabilities.data[1]
      : 0;
    console.log("HT prediction:", pred_ht);

    // Step 3: Dyslipidemia prediction (add pred_dm, pred_ht)
    const hlipFeatures = new Float32Array([...scaledFeatures, pred_dm, pred_ht]);
    const hlipTensor = new ort.Tensor("float32", hlipFeatures, [1, 12]);
    const hlipResult = await modelCache.hlip!.run({ float_input: hlipTensor });
    const pred_hlip = Array.isArray(hlipResult.probabilities.data)
      ? hlipResult.probabilities.data[1]
      : hlipResult.probabilities.data instanceof Float32Array
      ? hlipResult.probabilities.data[1]
      : 0;
    console.log("HLIP prediction:", pred_hlip);

    // Step 4: Sleep apnea prediction (add pred_dm, pred_ht, pred_hlip)
    const osasFeatures = new Float32Array([...scaledFeatures, pred_dm, pred_ht, pred_hlip]);
    const osaTensor = new ort.Tensor("float32", osasFeatures, [1, 13]);
    const osasResult = await modelCache.osas!.run({ float_input: osaTensor });
    const pred_osas = Array.isArray(osasResult.probabilities.data)
      ? osasResult.probabilities.data[1]
      : osasResult.probabilities.data instanceof Float32Array
      ? osasResult.probabilities.data[1]
      : 0;
    console.log("OSAS prediction:", pred_osas);

    // Return results
    return new Response(
      JSON.stringify({
        predictions: {
          diabetes: (pred_dm * 100).toFixed(1) + "%",
          hypertension: (pred_ht * 100).toFixed(1) + "%",
          dyslipidemia: (pred_hlip * 100).toFixed(1) + "%",
          sleep_apnea: (pred_osas * 100).toFixed(1) + "%",
        },
        raw_probabilities: {
          diabetes: pred_dm,
          hypertension: pred_ht,
          dyslipidemia: pred_hlip,
          sleep_apnea: pred_osas,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Prediction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
