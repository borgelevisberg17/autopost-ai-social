import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThumbnailRequest {
  title: string;
  style?: 'youtube' | 'instagram' | 'tiktok' | 'linkedin';
  theme?: string;
  includeText?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, style = 'youtube', theme, includeText = true }: ThumbnailRequest = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Generate optimized prompt for thumbnail
    const styleGuides: Record<string, string> = {
      youtube: 'YouTube thumbnail style, 16:9 aspect ratio, bold vibrant colors, high contrast, eye-catching, clickbait style, professional quality, 4K resolution',
      instagram: 'Instagram post style, 1:1 square format, clean modern aesthetic, vibrant colors, social media optimized',
      tiktok: 'TikTok cover style, 9:16 vertical format, trendy, youth-oriented, dynamic, colorful',
      linkedin: 'LinkedIn professional style, 16:9 format, clean, corporate, trustworthy, blue tones'
    };

    const prompt = `Create a stunning ${styleGuides[style]}. 
Theme: ${theme || 'modern tech/business'}.
${includeText ? `Include bold text overlay saying: "${title.substring(0, 30)}..."` : 'No text, pure visual design.'}
Make it visually striking with excellent composition. Ultra high resolution.`;

    console.log('Generating thumbnail with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        modalities: ['image', 'text']
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
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    console.log('Thumbnail generated successfully');

    return new Response(JSON.stringify({ 
      imageUrl,
      message: textResponse,
      style,
      title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar thumbnail' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
