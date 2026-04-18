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

type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await readJsonBody(req);

    let imageContents: ImageContent[] = [];

    if (body.images && Array.isArray(body.images)) {
      if (body.images.length === 0) {
        throw new RequestError(400, "No images provided");
      }

      imageContents = body.images.map((img: unknown, index: number) => {
        if (!img || typeof img !== "object" || Array.isArray(img)) {
          throw new RequestError(400, `Invalid images[${index}]`);
        }

        const entry = img as Record<string, unknown>;
        const base64 = requireBase64String(entry.base64, `images[${index}].base64`);
        const mimeType = optionalString(entry.mimeType, "image/jpeg");

        return {
          type: "image_url" as const,
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
          },
        };
      });
    } else if (body.image) {
      const image = requireBase64String(body.image, "image");
      const mimeType = optionalString(body.mimeType, "image/jpeg");
      imageContents = [
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${image}`,
          },
        },
      ];
    } else {
      return errorResponse("No images provided", 400);
    }

    const imageLabels = body.images
      ? body.images
          .map((img: unknown, index: number) => {
            if (!img || typeof img !== "object" || Array.isArray(img)) {
              return `photo ${index + 1}`;
            }

            return optionalString((img as Record<string, unknown>).label, `photo ${index + 1}`);
          })
          .join(", ")
      : "single exterior photo";

    const prompt = `Act as a certified energy auditor (Polish market, PN-EN 16247 standard). You are analyzing ${imageContents.length} photo(s) of a building from different angles: ${imageLabels}.

Cross-reference all photos to provide the MOST ACCURATE assessment possible. Multiple angles allow you to:
- Verify wall insulation consistency across all sides
- Assess window quality from multiple perspectives
- Better estimate building dimensions and total area
- Identify thermal bridges that may only be visible from certain angles
- Evaluate roof condition and solar potential more accurately

Provide an extremely comprehensive assessment:

1. **Building identification:**
   - Building type in Polish (e.g. "Dom jednorodzinny", "Blizniak", "Kamienica", "Budynek wielorodzinny")
   - Estimated year of construction based on architectural style
   - Number of visible floors (including attic if habitable)

2. **Dimensions & area estimation:**
   - Estimated footprint in square meters (cross-reference multiple angles for accuracy, default 120 if unsure)
   - Estimated total heated area considering all floors

3. **Insulation assessment** (rate as "Poor", "Average", or "Good"):
   - Wall insulation quality per side if multiple photos available
   - Window quality - single/double/triple glazing, PVC vs wood vs aluminum, age
   - Roof insulation - roof material, age, visible insulation
   - Foundation/basement - visible damp-proofing, thermal bridging

4. **Current heating system clues:**
   - Visible chimney type (gas flue, coal chimney, none)
   - Existing outdoor units (AC/heat pump)
   - Gas meter or connection visible

5. **Solar potential:**
   - Roof orientation (compass direction estimate)
   - Roof angle estimate in degrees
   - Available unshaded roof area in m2
   - Shading from trees or neighboring buildings
   - Recommended PV installation size in kWp

6. **Building envelope issues:**
   - Visible thermal bridges (balcony slabs, window lintels, corners)
   - Moisture/mold damage visible
   - Air tightness concerns

7. **Overall written summary** - a 3-5 sentence expert narrative assessment of the building's energy condition in Polish, mentioning key strengths and weaknesses.

8. **Priority actions** - list 3-5 most impactful improvements with estimated cost and energy saving percentage.

9. **Heating cost comparison** - estimate annual heating costs in PLN for: gas, coal, heat pump, and electric heating for this specific building.

10. **Geometria i bryla:**
    - Estimated building volume (m3) = footprint x floors x ~2.7m
    - A/V ratio (envelope area / volume) - kluczowy wskaznik strat
    - Compactness rating ("compact", "moderate", "complex")
    - Wall material guess (cegla pelna / pustak / silikat / beton komorkowy / drewno / wielka plyta / nieznane)
    - Estimated wall thickness in cm (from window reveals if visible)
    - Window-to-wall ratio (WWR) per visible elevation in %

11. **Risk flags (KRYTYCZNE):**
    - Asbestos suspicion (eternit dachowy/elewacyjny) - true/false + confidence
    - Visible structural cracks - true/false + description
    - Lack of damp-proof course on cokole - true/false
    - Missing flashings/gutters - true/false
    - Heat pump outdoor unit placement suggestion (which wall + reasoning)

12. **Confidence score** for each major field (0-100%): how certain is the AI given the photos provided.

Return strictly JSON with no markdown formatting:
{
  "building_type": string,
  "construction_year_estimate": number,
  "floors": number,
  "estimated_sqm": number,
  "total_heated_area": number,
  "insulation_status": "Poor" | "Average" | "Good",
  "wall_insulation": { "quality": "Poor" | "Average" | "Good", "details": string },
  "windows": { "quality": "Poor" | "Average" | "Good", "type": string, "details": string },
  "roof": { "quality": "Poor" | "Average" | "Good", "material": string, "details": string },
  "heating_clues": { "chimney_type": string, "existing_systems": string[], "notes": string },
  "solar_potential": {
    "roof_orientation": string,
    "roof_angle_deg": number,
    "available_area_sqm": number,
    "shading_issues": string,
    "recommended_pv_kwp": number
  },
  "thermal_bridges": string[],
  "moisture_issues": string,
  "air_tightness": "Poor" | "Average" | "Good",
  "energy_class_estimate": "A" | "B" | "C" | "D" | "E" | "F" | "G",
  "heat_demand_w_per_m2": number,
  "recommended_improvements": string[],
  "overall_summary": string,
  "priority_actions": [
    { "action": string, "estimated_cost_pln": number, "energy_saving_percent": number }
  ],
  "heating_cost_comparison": {
    "gas_annual_pln": number,
    "coal_annual_pln": number,
    "heat_pump_annual_pln": number,
    "electric_annual_pln": number
  },
  "geometry": {
    "estimated_volume_m3": number,
    "av_ratio": number,
    "compactness": "compact" | "moderate" | "complex",
    "wall_material": string,
    "wall_thickness_cm": number,
    "wwr_percent": number
  },
  "risk_flags": {
    "asbestos_suspected": boolean,
    "asbestos_confidence": number,
    "structural_cracks": boolean,
    "cracks_description": string,
    "missing_damp_course": boolean,
    "missing_flashings": boolean,
    "heat_pump_placement_suggestion": string
  },
  "heat_loss_distribution": {
    "walls_percent": number,
    "roof_percent": number,
    "windows_percent": number,
    "floor_percent": number,
    "ventilation_percent": number,
    "thermal_bridges_percent": number
  },
  "confidence_scores": {
    "overall": number,
    "envelope": number,
    "geometry": number,
    "solar": number
  }
}`;

    const content = await callGeminiChatCompletion(
      [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...imageContents],
        },
      ],
      "AI_MODEL_HOUSE",
    );

    const parsed = parseJsonObject(content);

    return jsonResponse(parsed);
  } catch (error) {
    console.error("analyze-house error:", error);
    if (error instanceof RequestError) {
      return errorResponse(error.message, error.status);
    }
    if (error instanceof AIRequestError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
