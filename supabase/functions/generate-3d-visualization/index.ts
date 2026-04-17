// Edge function: aplica a textura de uma pedra na foto do ambiente do cliente
// usando Lovable AI Gateway (Nano Banana / google/gemini-2.5-flash-image)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SURFACE_LABEL: Record<string, string> = {
  bancada: "the kitchen countertop / bench top surface",
  piso: "the floor surface",
  parede: "the wall surface (as cladding)",
  ilha: "the kitchen island top surface",
  mesa: "the table top surface",
  lavatorio: "the bathroom vanity / sink top surface",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Body inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      ambientImage, // data URL ou URL pública da foto do ambiente
      stoneImage, // URL pública da foto da pedra
      surface = "bancada",
      stoneName = "pedra natural",
    } = body as {
      ambientImage?: string;
      stoneImage?: string;
      surface?: string;
      stoneName?: string;
    };

    if (!ambientImage || !stoneImage) {
      return new Response(
        JSON.stringify({ error: "ambientImage e stoneImage são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const surfaceDesc = SURFACE_LABEL[surface] ?? SURFACE_LABEL.bancada;

    const prompt = `You are a professional interior visualization AI.

I'm giving you TWO images:
1) The FIRST image is a real photograph of an environment (a kitchen, bathroom or living space) sent by the customer.
2) The SECOND image is a photo of a natural stone slab (${stoneName}) — use it ONLY as a TEXTURE/MATERIAL reference.

Your task: REALISTICALLY apply the stone from image 2 as the new material on ${surfaceDesc} of the environment in image 1.

STRICT REQUIREMENTS:
- Preserve the original photo's perspective, camera angle, scale, lighting direction and shadows.
- Keep ALL other elements untouched: walls (unless surface=parede), cabinets, appliances, sinks, faucets, decoration.
- Match the stone veining direction to the surface orientation; respect joints and edges.
- Reproduce realistic reflections, specular highlights and subtle shadows on the new stone surface.
- Do NOT add or remove furniture. Do NOT change colors of other elements.
- Output must look like a real photograph, not a 3D render.

Return ONLY the edited image.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: ambientImage } },
              { type: "image_url", image_url: { url: stoneImage } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI gateway error", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "Falha ao gerar visualização" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const imageUrl: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image returned", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "A IA não retornou uma imagem. Tente outra foto." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-3d-visualization error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
