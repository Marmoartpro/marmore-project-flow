import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com requisições CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { client_id, material_id, material_price, measurements, service_type, image_base64 } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error("Chave da API do Gemini não configurada.")
    }

    // Define o modelo com base na presença da imagem
    const model = image_base64 ? "gemini-1.5-pro-latest" : "gemini-1.5-flash-latest"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    // Constrói o prompt dinamicamente
    let promptText = `
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

    // Prepara o corpo da requisição para a API do Gemini
    let contents: any[] = [{
      parts: [{ text: promptText }]
    }]

    // Se houver imagem, adiciona ao conteúdo
    if (image_base64) {
      // Limpa o prefixo data:image/...;base64, se existir
      const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
      contents[0].parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Data
        }
      });
    }

    // Faz a chamada para a API do Google Gemini
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        }
      })
    })

    const geminiData = await response.json()

    if (!response.ok) {
      console.error("Erro do Gemini:", geminiData)
      throw new Error(geminiData.error?.message || "Erro desconhecido na API do Gemini")
    }

    // Extrai o texto da resposta
    const resultText = geminiData.candidates[0].content.parts[0].text
    const parsedResult = JSON.parse(resultText)

    // Retorna o resultado para o frontend
    return new Response(
      JSON.stringify(parsedResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
