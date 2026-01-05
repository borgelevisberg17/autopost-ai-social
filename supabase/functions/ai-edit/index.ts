import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EditAction = 
  | 'split' 
  | 'hashtags' 
  | 'emojis' 
  | 'tone' 
  | 'translate' 
  | 'shorten' 
  | 'expand'
  | 'generate-script'
  | 'generate-cc';

interface EditRequest {
  action: EditAction;
  content: string;
  targetLanguage?: string;
  targetTone?: string;
  platform?: string;
  videoDuration?: number;
}

const getPromptForAction = (request: EditRequest): string => {
  const { action, content, targetLanguage, targetTone, platform, videoDuration } = request;

  switch (action) {
    case 'split':
      return `Divida o seguinte texto em partes menores e coesas, adequadas para uma série de posts ou stories. Cada parte deve ter sentido próprio e manter o contexto. Separe cada parte com "---".

Texto original:
${content}

Retorne apenas as partes divididas, sem explicações.`;

    case 'hashtags':
      return `Analise o seguinte texto e adicione hashtags relevantes e populares ao final. Use entre 10-15 hashtags estratégicas para ${platform || 'redes sociais'}. Misture hashtags populares com hashtags de nicho.

Texto:
${content}

Retorne o texto original + hashtags ao final. Apenas o resultado, sem explicações.`;

    case 'emojis':
      return `Adicione emojis relevantes ao seguinte texto para torná-lo mais engajante e visual. Use emojis de forma estratégica, não excessiva. Mantenha profissionalismo.

Texto:
${content}

Retorne apenas o texto com emojis, sem explicações.`;

    case 'tone':
      return `Reescreva o seguinte texto alterando o tom para "${targetTone || 'profissional'}". Mantenha a mensagem principal, mas adapte o estilo de escrita.

Tons possíveis: divertido, profissional, emocional, inspirador, educativo, provocativo, casual

Texto original:
${content}

Retorne apenas o texto reescrito, sem explicações.`;

    case 'translate':
      return `Traduza o seguinte texto para ${targetLanguage || 'inglês'}. Mantenha o tom, emojis e hashtags. Adapte expressões idiomáticas para soar natural no idioma de destino.

Texto:
${content}

Retorne apenas a tradução, sem explicações.`;

    case 'shorten':
      return `Resuma o seguinte texto mantendo a mensagem principal, o tom e o impacto. Reduza em aproximadamente 50% mantendo a essência e os elementos-chave (CTA, emojis importantes, etc).

Texto:
${content}

Retorne apenas o texto resumido, sem explicações.`;

    case 'expand':
      return `Expanda o seguinte texto adicionando mais detalhes, exemplos ou argumentos. Mantenha o tom e estilo originais. Adicione valor sem ser repetitivo.

Texto:
${content}

Retorne apenas o texto expandido, sem explicações.`;

    case 'generate-script':
      return `Crie um roteiro de vídeo de ${videoDuration || 60} segundos baseado no seguinte conteúdo. O roteiro deve incluir:

1. [GANCHO] - Primeiros 3 segundos para capturar atenção
2. [CENAS] - Descrição visual de cada cena
3. [NARRAÇÃO] - Texto a ser falado
4. [TEXTO NA TELA] - Textos/legendas a aparecer
5. [CTA] - Call-to-action final

Formato do roteiro:
[TEMPO: 0:00-0:03]
CENA: descrição visual
NARRAÇÃO: "texto falado"
TEXTO NA TELA: texto overlay

Conteúdo base:
${content}

Gere o roteiro completo.`;

    case 'generate-cc':
      return `Gere legendas/closed captions para o seguinte roteiro ou texto de vídeo. 
Formate como legendas SRT com timestamps aproximados.

Conteúdo:
${content}

Duração aproximada: ${videoDuration || 60} segundos

Formato:
1
00:00:00,000 --> 00:00:03,000
Texto da legenda

2
00:00:03,000 --> 00:00:06,000
Próxima legenda

Gere as legendas completas.`;

    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EditRequest = await req.json();
    const { action, content } = request;

    if (!action || !content) {
      return new Response(JSON.stringify({ error: 'Action and content are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = getPromptForAction(request);

    console.log(`Processing AI edit action: ${action}`);

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
            content: 'Você é um assistente especializado em edição de conteúdo para redes sociais e vídeos. Seja direto e retorne apenas o resultado solicitado, sem explicações adicionais.'
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
    const result = data.choices?.[0]?.message?.content;

    if (!result) {
      throw new Error('No result generated');
    }

    console.log(`AI edit action ${action} completed successfully`);

    return new Response(JSON.stringify({ 
      result,
      action,
      originalContent: content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-edit function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao processar edição' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
