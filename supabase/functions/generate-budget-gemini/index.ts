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
    const body = await req.json()
    const { mode } = body // 'generate' | 'review'

    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY não configurada.")
    }

    let messages: any[]
    let model: string

    if (mode === 'review') {
      // Review/optimize existing budget with pricing context
      const { ambientes, acessorios, totalGeral, margemLucro } = body
      model = "google/gemini-3-flash-preview"
      messages = [
        {
          role: "system",
          content: `Você é um consultor especialista em marmoraria. Analise o orçamento completo incluindo custos de material, mão de obra e instalação. Retorne um JSON com:
{
  "alertas": [{"tipo": "erro"|"aviso"|"dica", "mensagem": "texto"}],
  "otimizacoes": [{"peca": "nome", "sugestao": "texto", "economia_estimada": numero_ou_null, "campo": "campo_do_formulario_ou_null", "ambiente_idx": indice_ou_null, "peca_idx": indice_ou_null}],
  "aproveitamento_chapa": {"observacao": "texto sobre como otimizar o corte das chapas"}
}
Verifique: preços inconsistentes, áreas suspeitas, peças que podem ser cortadas juntas, margens fora do padrão do mercado (25-40%), dimensões atípicas, custos de mão de obra que parecem altos ou baixos demais para o m² calculado, valor total do orçamento em relação ao mercado. Responda APENAS JSON válido sem markdown.`
        },
        {
          role: "user",
          content: `Analise este orçamento (margem de lucro: ${margemLucro || 30}%, total geral: R$ ${(totalGeral || 0).toFixed(2)}):\n${JSON.stringify({ ambientes, acessorios }, null, 2)}`
        }
      ]
    } else {
      // Generate budget - return Ambiente[] format
      const { material_name, material_price, stone_id, measurements, service_type, image_base64 } = body
      model = image_base64 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview"

      const promptText = `
Você é um orçamentista especialista em marmoraria.
Material: ${material_name || 'Não especificado'} - R$ ${material_price}/m²
Serviço: ${service_type || 'Corte e Acabamento padrão'}
Medidas/Descrição: ${measurements || 'Analisar imagem anexa'}

REGRAS:
1. Identifique todos os ambientes e peças do projeto.
2. Para cada peça, informe medidas em CENTÍMETROS.
3. Identifique o tipo correto de cada peça: Bancada, Ilha Gourmet, Lavatório, Bancada de Banheiro, Soleira, Peitoril, Rodapé/Filete, Borda de Piscina, Escada/Degrau, Nicho Embutido, Bancada Tanque, Revestimento de Parede, Piso, Tampo de Mesa, Box - Piso, Peça Personalizada.
4. Identifique o ambiente correto: Cozinha, Banheiro Social, Banheiro Suíte, Lavatório Avulso, Bancada Tanque, Lavanderia, Área da Piscina, Acabamentos (Soleiras e Peitoris), Área Externa, Sala / Estar, Área Gourmet, Ambiente Personalizado.
5. Se houver espelho/backsplash, saia, cuba, furos, recorte cooktop, informe.

RETORNE APENAS JSON VÁLIDO com esta estrutura (sem markdown):
{
  "ambientes": [
    {
      "tipo": "Cozinha",
      "pecas": [
        {
          "nomePeca": "Bancada principal",
          "tipo": "Bancada",
          "formato": "retangular",
          "largura": "60",
          "comprimento": "250",
          "quantidade": "1",
          "descricao": "Bancada da pia",
          "espelhoBacksplash": false,
          "espelhoBacksplashAltura": "",
          "saiaFrontal": false,
          "saiaFrontalAltura": "",
          "tipoCuba": "Sem cuba",
          "furosTorneira": "Nenhum",
          "rebaixoCooktop": false,
          "acabamentoBorda": "Reto",
          "bordasComAcabamento": "Só frontal"
        }
      ]
    }
  ],
  "resumo": "Descrição geral do que foi identificado"
}
`

      messages = [
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
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.1 }),
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
