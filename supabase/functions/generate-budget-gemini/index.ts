import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { material_price, measurements, service_type, image_base64 } = await req.json()

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY não configurada.")
    }

    const promptText = `
    Você é um orçamentista especialista em marmoraria.
    Material Escolhido: Preço R$ ${material_price}/m²
    Serviço: ${service_type || 'Corte e Acabamento padrão'}
    Medidas/Descrição: ${measurements || 'Analisar imagem anexa'}
    
    REGRAS DE CÁLCULO:
    1. Calcule a área total em m² (incluindo bancadas, ilhas, frontões/rodabancas e saias).
    2. Custo do Material = Área Total (m²) * R$ ${material_price}.
    3. Custo de Mão de Obra = 30% do Custo do Material.
    4. Preço Final = Custo Material + Custo Mão de Obra.
    
    RETORNE APENAS UM JSON VÁLIDO COM ESTA ESTRUTURA (sem formatação markdown):
    {
      "total_area_m2": numero_float,
      "material_cost": numero_float,
      "labor_cost": numero_float,
      "total_price": numero_float,
      "description": "Texto explicando os itens encontrados e as medidas",
      "items": [{"name": "nome da peça", "area": numero_float}]
    }
    `

    const messages: any[] = [
      { role: "system", content: "Você é um orçamentista especialista em marmoraria. Responda sempre em JSON válido." },
    ]

    if (image_base64) {
      const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "")
      messages.push({
        role: "user",
        content: [
          { type: "text", text: promptText },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
        ],
      })
    } else {
      messages.push({ role: "user", content: promptText })
    }

    const model = image_base64 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview"

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const errorText = await response.text()
      console.error("AI gateway error:", response.status, errorText)
      throw new Error("Erro ao chamar o serviço de IA")
    }

    const aiData = await response.json()
    const resultText = aiData.choices?.[0]?.message?.content || ""

    // Limpa possíveis marcadores de código markdown
    const cleanJson = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsedResult = JSON.parse(cleanJson)

    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("generate-budget-gemini error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
