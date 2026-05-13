import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { manufacturer, model, year } = await req.json();
    if (!manufacturer || !model) throw new Error("Missing manufacturer or model");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

    const yearContext = year ? ` från ${year}` : "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du är expert på industriella maskiner, entreprenadmaskiner och fordon.
Din uppgift är att slå upp tekniska specifikationer för en given maskinmodell.
Returnera ENDAST JSON, inget annat.

Format:
{
  "category": "excavator" | "wheel_loader" | "bulldozer" | "dumper" | "crane" | "forklift" | "tractor" | "telehandler" | "compactor" | "generator" | "aerial_platform" | "skid_steer" | "mini_excavator" | "backhoe" | "other",
  "subcategory": string | null,
  "weight_kg": number | null,
  "engine_power_kw": number | null,
  "fuel_type": "diesel" | "petrol" | "electric" | "hybrid" | "lpg" | null,
  "engine_manufacturer": string | null,
  "engine_model": string | null,
  "bucket_capacity_m3": number | null,
  "max_reach_m": number | null,
  "max_lift_capacity_kg": number | null,
  "track_or_wheel": "track" | "wheel" | "both" | null,
  "typical_applications": string[],
  "production_years": { "from": number | null, "to": number | null },
  "successor_model": string | null,
  "predecessor_model": string | null,
  "notes": string | null,
  "confidence": number (0-1)
}

Om du inte hittar exakt information, gör en kvalificerad uppskattning baserat på liknande modeller i samma serie. Sätt confidence lägre för uppskattningar.`,
          },
          {
            role: "user",
            content: `Slå upp tekniska specifikationer för: ${manufacturer} ${model}${yearContext}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    const specs = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(specs), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
