import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Authorization header present:", !!authHeader);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }

    if (!user) {
      console.error("No user found in token");
      throw new Error("Not authenticated");
    }

    console.log("Computing style preferences for user:", user.id);

    // Fetch user data
    const [favoritesResult, historyResult, suitcasesResult, wardrobeResult] = await Promise.all([
      supabaseClient.from("favorite_outfits").select("*").eq("user_id", user.id),
      supabaseClient.from("outfit_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabaseClient.from("suitcase_outfits").select("*").eq("user_id", user.id),
      supabaseClient.from("wardrobe_items").select("*").eq("user_id", user.id),
    ]);

    if (favoritesResult.error) throw favoritesResult.error;
    if (historyResult.error) throw historyResult.error;
    if (suitcasesResult.error) throw suitcasesResult.error;
    if (wardrobeResult.error) throw wardrobeResult.error;

    const favorites = favoritesResult.data || [];
    const history = historyResult.data || [];
    const suitcases = suitcasesResult.data || [];
    const wardrobe = wardrobeResult.data || [];

    console.log(`Data fetched: ${favorites.length} favorites, ${history.length} history, ${suitcases.length} suitcase outfits, ${wardrobe.length} wardrobe items`);

    // If user has no activity, return empty preferences
    if (favorites.length === 0 && history.length === 0 && suitcases.length === 0) {
      console.log("No activity found, returning empty preferences");
      
      const emptyPreferences = {
        user_id: user.id,
        item_usage: {},
        favorite_colors: [],
        occasion_preferences: [],
        favorite_combinations: [],
        skip_patterns: {},
        last_computed_at: new Date().toISOString(),
      };

      await supabaseClient
        .from("user_style_preferences")
        .upsert(emptyPreferences, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          success: true,
          isEmpty: true,
          topItems: [],
          occasionPreferences: [],
          favoriteCombinations: [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Compute item usage frequency
    const itemUsage: Record<string, number> = {};
    
    [...favorites, ...history].forEach((outfit) => {
      [
        outfit.top_item_id,
        outfit.bottom_item_id,
        outfit.shoes_item_id,
        outfit.dress_item_id,
        outfit.outerwear_item_id,
        outfit.accessory_item_id,
      ].forEach((itemId) => {
        if (itemId) {
          itemUsage[itemId] = (itemUsage[itemId] || 0) + 1;
        }
      });
    });

    // Get top 20 most used items
    const topItems = Object.entries(itemUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([itemId, count]) => ({
        itemId,
        count,
        item: wardrobe.find((w) => w.id === itemId),
      }))
      .filter((item) => item.item);

    // Compute occasion preferences
    const occasionCounts: Record<string, number> = {};
    suitcases.forEach((outfit) => {
      const occasion = outfit.occasion || "casual";
      occasionCounts[occasion] = (occasionCounts[occasion] || 0) + 1;
    });

    const occasionPreferences = Object.entries(occasionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([occasion, count]) => ({ occasion, count }));

    // Compute favorite combinations (items frequently paired together)
    const combinations: Record<string, number> = {};
    [...favorites, ...history].forEach((outfit) => {
      const items = [
        outfit.top_item_id,
        outfit.bottom_item_id,
        outfit.shoes_item_id,
        outfit.dress_item_id,
        outfit.outerwear_item_id,
      ].filter(Boolean);

      // Create pairs
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pair = [items[i], items[j]].sort().join(":");
          combinations[pair] = (combinations[pair] || 0) + 1;
        }
      }
    });

    const favoriteCombinations = Object.entries(combinations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => {
        const [item1Id, item2Id] = pair.split(":");
        return {
          item1Id,
          item2Id,
          count,
          item1: wardrobe.find((w) => w.id === item1Id),
          item2: wardrobe.find((w) => w.id === item2Id),
        };
      })
      .filter((combo) => combo.item1 && combo.item2);

    // Store preferences
    const preferences = {
      user_id: user.id,
      item_usage: itemUsage,
      favorite_colors: [], // Could be computed from image analysis
      occasion_preferences: occasionPreferences,
      favorite_combinations: favoriteCombinations,
      skip_patterns: {},
      last_computed_at: new Date().toISOString(),
    };

    // Upsert preferences
    const { error: upsertError } = await supabaseClient
      .from("user_style_preferences")
      .upsert(preferences, { onConflict: "user_id" });

    if (upsertError) throw upsertError;

    console.log("✓ Style preferences computed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        topItems: topItems.slice(0, 10),
        occasionPreferences: occasionPreferences.slice(0, 5),
        favoriteCombinations: favoriteCombinations.slice(0, 5),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error computing style preferences:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
