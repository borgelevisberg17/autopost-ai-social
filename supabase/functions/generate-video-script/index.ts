import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoScriptRequest {
  topic: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'shorts';
  duration: number; // in seconds
  style: 'educational' | 'entertainment' | 'promotional' | 'tutorial' | 'storytelling';
  includeHooks?: boolean;
  includeCTA?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topic, 
      platform = 'youtube', 
      duration = 60, 
      style = 'educational',
      includeHooks = true,
      includeCTA = true 
    }: VideoScriptRequest = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const platformGuides: Record<string, string> = {
      youtube: 'YouTube video with detailed explanations, professional tone, engaging pace',
      tiktok: 'TikTok with fast pace, trending sounds references, Gen-Z friendly language, vertical format',
      instagram: 'Instagram Reels with visual focus, aesthetic appeal, trend-aware content',
      shorts: 'YouTube Shorts with quick hooks, fast information delivery, vertical format'
    };

    const styleGuides: Record<string, string> = {
      educational: 'informative, clear explanations, value-focused, teach something new',
      entertainment: 'fun, engaging, humorous, keep viewer entertained throughout',
      promotional: 'persuasive, benefits-focused, subtle selling, trust-building',
      tutorial: 'step-by-step instructions, clear demonstrations, actionable tips',
      storytelling: 'narrative arc, emotional connection, relatable situations'
    };

    const prompt = `Crie um roteiro completo de vídeo com as seguintes especificações:

📋 BRIEFING:
- Tópico: ${topic}
- Plataforma: ${platform} (${platformGuides[platform]})
- Duração: ${duration} segundos
- Estilo: ${style} (${styleGuides[style]})

📝 ESTRUTURA DO ROTEIRO:

${includeHooks ? `
🎣 GANCHO (Primeiros 3 segundos):
- Frase de impacto para capturar atenção imediatamente
- Pode ser pergunta, afirmação chocante, ou promessa de valor
` : ''}

📍 CENAS DETALHADAS:
Para cada cena, inclua:
[TEMPO: XX:XX - XX:XX]
🎬 CENA: Descrição visual detalhada
🎙️ NARRAÇÃO: "Texto exato a ser falado"
📝 TEXTO NA TELA: Overlays e legendas
🎵 SOM/MÚSICA: Sugestão de áudio/efeitos
✨ TRANSIÇÃO: Tipo de transição para próxima cena

${includeCTA ? `
📢 CALL-TO-ACTION:
- CTA principal claro e compelling
- Instruções específicas para o viewer
` : ''}

📊 EXTRAS:
- Sugestões de B-roll
- Pontos para inserir cortes/efeitos
- Momentos de ênfase visual

Gere um roteiro profissional e detalhado que seja fácil de seguir durante a produção.`;

    console.log(`Generating video script for ${platform}, ${duration}s`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um roteirista profissional especializado em conteúdo para redes sociais e YouTube. Crie roteiros detalhados, criativos e prontos para produção.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const script = data.choices?.[0]?.message?.content;

    if (!script) {
      throw new Error('No script generated');
    }

    console.log('Video script generated successfully');

    return new Response(JSON.stringify({ 
      script,
      metadata: {
        topic,
        platform,
        duration,
        style
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-video-script function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar roteiro' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
