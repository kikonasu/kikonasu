import { supabase } from "@/integrations/supabase/client";

export const calculateOutfitPotential = async (
  wishListCategory: string,
  userId: string
): Promise<number> => {
  try {
    // Fetch user's existing wardrobe items
    const { data: wardrobeItems, error } = await supabase
      .from("wardrobe_items")
      .select("category")
      .eq("user_id", userId);

    if (error) throw error;
    if (!wardrobeItems) return 0;

    // Count items by category
    const categoryCounts: Record<string, number> = {};
    wardrobeItems.forEach((item) => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    const tops = categoryCounts.Top || 0;
    const bottoms = categoryCounts.Bottom || 0;
    const shoes = categoryCounts.Shoes || 0;
    const dresses = categoryCounts.Dress || 0;
    const outerwear = categoryCounts.Outerwear || 0;

    let outfitCount = 0;

    switch (wishListCategory) {
      case "Top":
        // A new top can pair with each bottom + shoe combination
        outfitCount = bottoms * shoes;
        break;

      case "Bottom":
        // A new bottom can pair with each top + shoe combination
        outfitCount = tops * shoes;
        break;

      case "Shoes":
        // New shoes can pair with each top+bottom combo AND each dress
        outfitCount = tops * bottoms + dresses;
        break;

      case "Dress":
        // A dress only needs shoes to complete an outfit
        outfitCount = shoes;
        break;

      case "Outerwear":
        // Outerwear can be added to any complete outfit
        // Count complete outfits: (top+bottom+shoes) + (dress+shoes)
        outfitCount = tops * bottoms * shoes + dresses * shoes;
        break;

      case "Accessory":
        // Accessories can be added to any complete outfit
        // Count complete outfits: (top+bottom+shoes) + (dress+shoes)
        outfitCount = tops * bottoms * shoes + dresses * shoes;
        break;

      default:
        outfitCount = 0;
    }

    return outfitCount;
  } catch (error) {
    console.error("Error calculating outfit potential:", error);
    return 0;
  }
};
