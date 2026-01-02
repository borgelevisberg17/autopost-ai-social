import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessType, audience, followerCount, tone, contentType, platform, topic } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um especialista em marketing digital e criação de conteúdo para redes sociais.
Seu objetivo é criar conteúdo envolvente, persuasivo e adaptado ao público-alvo.
Sempre inclua:
- Um gancho inicial chamativo
- Conteúdo relevante e valioso
- Um CTA (call-to-action) claro
- Hashtags relevantes quando apropriado
Adapte o tom e estilo conforme solicitado.`;

    const userPrompt = `Crie um ${contentType} para ${platform} para um negócio de ${businessType}.

Detalhes:
- Público-alvo: ${audience}
- Quantidade de seguidores: ${followerCount}
- Tom desejado: ${tone}
- Tema/Assunto: ${topic || 'geral sobre o negócio'}

Gere o conteúdo pronto para publicar, com no máximo 2200 caracteres para Instagram ou 280 para Twitter/X.
Inclua emojis apropriados e hashtags relevantes.`;

    console.log('Generating content with prompt:', userPrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated');
    }

    console.log('Content generated successfully');

    return new Response(JSON.stringify({ 
      content: generatedContent,
      metadata: {
        businessType,
        audience,
        followerCount,
        tone,
        contentType,
        platform,
        topic
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
