import { AIRequestError, callGeminiChatCompletion, parseJsonObject } from "../_shared/gemini.ts";
import {
  corsHeaders,
  errorResponse,
  jsonResponse,
  optionalString,
  readJsonBody,
  RequestError,
  requireBase64String,
} from "../_shared/http.ts";

interface LabelAnalysisResult {
  device_type: string;
  energy_class: string;
  consumption_per_cycle_kwh: number | null;
  consumption_per_100_cycles: number | null;
  consumption_annual: number | null;
  is_per_cycle: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await readJsonBody(req);
    const image = requireBase64String(body.image, "image");
    const mimeType = optionalString(body.mimeType, "image/jpeg");

    const systemPrompt = `You are an EU energy label expert. Analyze the photo and extract data.

RULES:
1. Read the energy class exactly as shown (A+++, A++, A+, A, B, C, D, E, F, G).
2. Read the device type (oven/piekarnik, washing machine/pralka, dishwasher/zmywarka, fridge/lodowka, TV/telewizor, etc.). Use Polish name.
3. For energy consumption:
   - If the label shows kWh/cycle (e.g. ovens): put the value in "consumption_per_cycle_kwh" and set is_per_cycle=true
   - If the label shows kWh per 100 cycles (e.g. washers): put the value in "consumption_per_100_cycles" and set is_per_cycle=true
   - If the label shows kWh/year or kWh/annum (e.g. fridges, TVs): put the value in "consumption_annual" and set is_per_cycle=false
4. If there are multiple consumption values (e.g. conventional vs fan-forced oven), use the HIGHER one (conventional).
5. Return ONLY raw JSON, no markdown, no code fences.

JSON structure:
{"device_type": string, "energy_class": string, "consumption_per_cycle_kwh": number|null, "consumption_per_100_cycles": number|null, "consumption_annual": number|null, "is_per_cycle": boolean}`;

    const content = await callGeminiChatCompletion(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType || "image/jpeg"};base64,${image}`,
              },
            },
            {
              type: "text",
              text: "Analyze this EU energy label and return JSON.",
            },
          ],
        },
      ],
      "AI_MODEL_LABEL",
    );

    const parsed = parseJsonObject<LabelAnalysisResult>(content);

    if (!parsed.device_type || !parsed.energy_class) {
      throw new Error("Invalid response: missing device_type or energy_class");
    }

    parsed.consumption_per_cycle_kwh = parsed.consumption_per_cycle_kwh ?? null;
    parsed.consumption_per_100_cycles = parsed.consumption_per_100_cycles ?? null;
    parsed.consumption_annual = parsed.consumption_annual ?? null;
    parsed.is_per_cycle = Boolean(parsed.is_per_cycle);

    return jsonResponse(parsed);
  } catch (error) {
    console.error("analyze-label error:", error);
    if (error instanceof RequestError) {
      return errorResponse(error.message, error.status);
    }
    if (error instanceof AIRequestError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Nie udalo sie przeanalizowac etykiety",
      500,
    );
  }
});
