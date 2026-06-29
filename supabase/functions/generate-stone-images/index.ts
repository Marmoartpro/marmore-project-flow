// Generates AI images (chapa, cozinha, banheiro) for a stone via Lovable AI Gateway
// and uploads them to the `mostruario` Supabase Storage bucket.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Kind = "chapa" | "cozinha" | "banheiro";

function buildPrompt(kind: Kind, stone: any): string {
  const name = stone.name || "pedra natural";
  const category = (stone.category || "pedra").toLowerCase();
  const colors = stone.colors || "tons neutros";
  const desc = [stone.observations, stone.usage_indication, stone.pros]
    .filter(Boolean)
    .join(". ")
    .slice(0, 280);

  if (kind === "chapa") {
    return `Fotografia profissional de uma chapa de ${category} ${name}, cor predominante ${colors}, padrão de veios e textura natural característicos (${desc}), superfície polida, iluminação de estúdio difusa e uniforme, vista frontal completa da chapa em pé, fundo neutro cinza claro, alta resolução, fotografia comercial de material de construção, sem pessoas, sem texto, sem marca d'água.`;
  }
  if (kind === "cozinha") {
    return `Fotografia de cozinha moderna e sofisticada com bancada em ${name} (${category}) cor ${colors}, armários planejados em tom neutro complementar, cooktop embutido, iluminação natural lateral, estilo contemporâneo brasileiro de alto padrão, ângulo de 45 graus mostrando a bancada e o cooktop, fotografia de arquitetura de interiores realista, sem pessoas, sem texto.`;
  }
  return `Fotografia de banheiro moderno e elegante com bancada de lavatório em ${name} (${category}) cor ${colors}, cuba de embutir, torneira metálica escovada, espelho grande iluminado, iluminação suave, estilo contemporâneo de alto padrão, fotografia de arquitetura de interiores realista, sem pessoas, sem texto.`;
}

async function generateImage(prompt: string, model: string): Promise<string> {
  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway ${res.status}: ${text.slice(0, 400)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Resposta sem b64_json");
  return b64;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { stone_id, kinds, model } = await req.json();
    if (!stone_id) throw new Error("stone_id obrigatório");
    const requested: Kind[] = Array.isArray(kinds) && kinds.length
      ? kinds.filter((k: string) => ["chapa", "cozinha", "banheiro"].includes(k))
      : ["chapa", "cozinha", "banheiro"];
    const useModel = model || "google/gemini-3-pro-image";

    // load stone
    let { data: stone, error: stoneErr } = await admin.from("stones").select("*").eq("id", stone_id).single();
    if (stoneErr || !stone) throw new Error("Pedra não encontrada");

    let cloned = false;
    let originalId: string | null = null;
    // ownership: if not owner, clone the stone (and its gallery photos) for this user, then generate on the clone.
    if (stone.owner_id !== user.id) {
      originalId = stone.id;
      const { id, created_at, updated_at, ...rest } = stone as any;
      const cloneData = {
        ...rest,
        owner_id: user.id,
        is_global: false,
        imagem_chapa_ia: null,
        imagem_cozinha_ia: null,
        imagem_banheiro_ia: null,
        imagens_geradas_por_ia: {},
      };
      const { data: newStone, error: cloneErr } = await admin.from("stones").insert(cloneData).select().single();
      if (cloneErr || !newStone) throw new Error("Falha ao clonar pedra: " + (cloneErr?.message || "desconhecido"));
      // copy gallery photos
      const { data: gallery } = await admin.from("stone_photos").select("photo_url").eq("stone_id", originalId);
      if (gallery && gallery.length > 0) {
        await admin.from("stone_photos").insert(
          gallery.map((g: any) => ({ stone_id: newStone.id, owner_id: user.id, photo_url: g.photo_url }))
        );
      }
      stone = newStone;
      cloned = true;
    }

    // check monthly limit
    const { data: profile } = await admin.from("profiles").select("ai_image_monthly_limit").eq("user_id", user.id).single();
    const limit = profile?.ai_image_monthly_limit ?? 50;
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1); startOfMonth.setUTCHours(0, 0, 0, 0);
    const { count: usedThisMonth } = await admin
      .from("ai_image_generations")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .gte("created_at", startOfMonth.toISOString());
    const remaining = Math.max(0, limit - (usedThisMonth || 0));
    if (remaining < requested.length) {
      return new Response(JSON.stringify({
        error: `Limite mensal de imagens IA atingido (${usedThisMonth}/${limit}). Restam ${remaining}, mas você pediu ${requested.length}.`,
        used: usedThisMonth, limit, remaining,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};
    const updates: any = { imagens_geradas_por_ia: { ...(stone.imagens_geradas_por_ia || {}) } };

    for (const kind of requested) {
      try {
        const prompt = buildPrompt(kind, stone);
        const b64 = await generateImage(prompt, useModel);
        const bytes = b64ToBytes(b64);
        const path = `${stone.id}/${kind}-${Date.now()}.png`;
        const { error: upErr } = await admin.storage.from("mostruario").upload(path, bytes, {
          contentType: "image/png", upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = admin.storage.from("mostruario").getPublicUrl(path);
        const url = pub.publicUrl;

        if (kind === "chapa") updates.imagem_chapa_ia = url;
        if (kind === "cozinha") updates.imagem_cozinha_ia = url;
        if (kind === "banheiro") updates.imagem_banheiro_ia = url;
        updates.imagens_geradas_por_ia[kind] = true;

        await admin.from("ai_image_generations").insert({
          owner_id: user.id, stone_id: stone.id, kind, image_url: url, prompt, model: useModel,
        });
        results[kind] = url;
      } catch (e: any) {
        errors[kind] = e.message || String(e);
      }
    }

    if (Object.keys(results).length > 0) {
      await admin.from("stones").update(updates).eq("id", stone.id);
    }

    const { count: usedAfter } = await admin
      .from("ai_image_generations")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    return new Response(JSON.stringify({
      results, errors, used: usedAfter, limit, remaining: Math.max(0, limit - (usedAfter || 0)),
      stone_id: stone.id, cloned, original_id: originalId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
