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
    const { imageBase64 } = await req.json();

    // Validate image data exists
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid image data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format (should start with data:image/)
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Must be a data URL starting with data:image/' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (max 10MB)
    const imageSize = imageBase64.length * 0.75; // Approximate decoded size
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (imageSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Image too large (max 10MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing image (size: ${(imageSize / 1024 / 1024).toFixed(2)}MB)`);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a clothing classification expert. Analyze clothing items and provide both a category and a detailed description. Return a JSON object with 'category' (one of: Top, Bottom, Shoes, Dress, Outerwear, Accessory) and 'description' (a detailed description including style, formality level, occasions, colors, patterns, material if visible). Example: {\"category\": \"Top\", \"description\": \"Casual white cotton t-shirt, suitable for everyday wear, athletic activities, and relaxed occasions\"}"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this clothing item. Provide a JSON response with category (Top/Bottom/Shoes/Dress/Outerwear/Accessory) and description (include formality, style, suitable occasions, colors, patterns)."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(
        JSON.stringify({ category: null, error: "Classification failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    // Try to parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content || '{}');
    } catch {
      // Fallback: try to extract category from text
      const validCategories = ["Top", "Bottom", "Shoes", "Dress", "Outerwear", "Accessory"];
      const detectedCategory = validCategories.find(c => 
        content?.toLowerCase().includes(c.toLowerCase())
      );
      parsedContent = { 
        category: detectedCategory || null, 
        description: content || null 
      };
    }
    
    // Validate category
    const validCategories = ["Top", "Bottom", "Shoes", "Dress", "Outerwear", "Accessory"];
    const detectedCategory = validCategories.find(c => 
      parsedContent.category?.toLowerCase().includes(c.toLowerCase())
    );

    return new Response(
      JSON.stringify({ 
        category: detectedCategory || null,
        description: parsedContent.description || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({ category: null, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
