import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Lock, Unlock, Shuffle, Loader2, Plus, X, Heart, Upload } from "lucide-react";
import { getSignedUrl } from "@/lib/storageUtils";
import { format } from "date-fns";
import { AddOutfitModal } from "@/components/AddOutfitModal";
import { WardrobeItemImage } from "@/components/WardrobeItemImage";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectWardrobeItemDialog } from "@/components/SelectWardrobeItemDialog";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  ai_analysis?: string | null;
  signedUrl?: string;
  isWishListItem?: boolean;
}

interface DayOutfit {
  id?: string;
  dayNumber: number;
  date: Date;
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  dress: WardrobeItem | null;
  outerwear: WardrobeItem | null;
  accessory: WardrobeItem | null;
  locked: Set<string>;
  occasion: string;
  occasionLabel: string | null;
  timeOfDay: string | null;
}

interface Suitcase {
  id: string;
  trip_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: string[];
  weather_data: any;
}

interface PackingItem {
  id: string;
  category: string;
  imageUrl: string;
  days: { dayNumber: number; occasion: string; occasionLabel: string | null }[];
}

const getCategoryEmoji = (category: string) => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('top') || categoryLower.includes('shirt')) return '👕';
  if (categoryLower.includes('bottom') || categoryLower.includes('pant') || categoryLower.includes('jean')) return '👖';
  if (categoryLower.includes('shoes') || categoryLower.includes('sneaker')) return '👟';
  if (categoryLower.includes('dress')) return '👗';
  if (categoryLower.includes('outerwear') || categoryLower.includes('jacket') || categoryLower.includes('coat')) return '🧥';
  if (categoryLower.includes('accessory')) return '👜';
  return '👔';
};

const SuitcaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suitcase, setSuitcase] = useState<Suitcase | null>(null);
  const [outfits, setOutfits] = useState<DayOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [addOutfitModalOpen, setAddOutfitModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [includeWishList, setIncludeWishList] = useState(false);
  const [wishListItems, setWishListItems] = useState<WardrobeItem[]>([]);
  const [showSelectItemDialog, setShowSelectItemDialog] = useState(false);
  const [selectItemCategory, setSelectItemCategory] = useState<string>("");
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSuitcase();
      loadCheckedState();
    }
  }, [id]);

  useEffect(() => {
    if (outfits.length > 0) {
      generatePackingList();
    }
  }, [outfits]);

  const loadCheckedState = () => {
    const stored = localStorage.getItem(`suitcase-${id}-checked`);
    if (stored) {
      setCheckedItems(new Set(JSON.parse(stored)));
    }
  };

  const saveCheckedState = (checked: Set<string>) => {
    localStorage.setItem(`suitcase-${id}-checked`, JSON.stringify([...checked]));
  };

  const loadSuitcase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("🔒 No user found, redirecting to auth");
        navigate("/auth", { replace: true });
        return;
      }
      console.log("✓ User authenticated, loading suitcase", { userId: user.id, suitcaseId: id });

      // Fetch suitcase
      const { data: suitcaseData, error: suitcaseError } = await supabase
        .from("suitcases")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (suitcaseError) throw suitcaseError;
      console.log('Suitcase weather data:', suitcaseData.weather_data);
      setSuitcase(suitcaseData);

      // Fetch wardrobe items
      const { data: items, error: itemsError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      console.log('📚 Fetched wardrobe items:', {
        total: items.length,
        tops: items.filter(i => i.category === 'Top').length,
        bottoms: items.filter(i => i.category === 'Bottom').length,
        shoes: items.filter(i => i.category === 'Shoes').length,
      });

      console.log('🔐 Generating signed URLs for all items...');
      const itemsWithUrls = await Promise.all(
        items.map(async (item) => {
          const signedUrl = await getSignedUrl(item.image_url);
          console.log(`✓ Generated URL for ${item.category}:`, {
            itemId: item.id,
            originalUrl: item.image_url.substring(0, 50),
            signedUrlGenerated: signedUrl !== item.image_url,
          });
          return { ...item, signedUrl };
        })
      );
      console.log('✓ Generated signed URLs for all items');
      setWardrobeItems(itemsWithUrls);

      // Fetch wish list items if toggle is enabled
      if (includeWishList) {
        const { data: wishItems, error: wishError } = await supabase
          .from("wish_list_items")
          .select("*")
          .eq("user_id", user.id);

        if (!wishError && wishItems) {
          const wishItemsWithUrls = await Promise.all(
            wishItems.map(async (item) => {
              const signedUrl = await getSignedUrl(item.image_url);
              return { ...item, signedUrl, isWishListItem: true };
            })
          );
          setWishListItems(wishItemsWithUrls);
        }
      }

      // Fetch existing outfits
      const { data: outfitData, error: outfitError } = await supabase
        .from("suitcase_outfits")
        .select("*")
        .eq("suitcase_id", id)
        .order("day_number", { ascending: true });

      if (outfitError) throw outfitError;

      // Calculate trip days
      const startDate = new Date(suitcaseData.start_date);
      const endDate = new Date(suitcaseData.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (outfitData && outfitData.length > 0) {
        // Load existing outfits
        console.log('👗 Loading existing outfits:', outfitData.length);
        const loadedOutfits = await Promise.all(
          outfitData.map(async (outfit) => {
            const date = new Date(outfit.outfit_date);
            const outfitItems = {
              id: outfit.id,
              dayNumber: outfit.day_number,
              date,
              top: await loadItem(outfit.top_item_id, itemsWithUrls),
              bottom: await loadItem(outfit.bottom_item_id, itemsWithUrls),
              shoes: await loadItem(outfit.shoes_item_id, itemsWithUrls),
              dress: await loadItem(outfit.dress_item_id, itemsWithUrls),
              outerwear: await loadItem(outfit.outerwear_item_id, itemsWithUrls),
              accessory: await loadItem(outfit.accessory_item_id, itemsWithUrls),
              locked: new Set<string>(),
              occasion: outfit.occasion || "casual",
              occasionLabel: outfit.occasion_label,
              timeOfDay: outfit.time_of_day,
            };
            console.log('👗 Outfit loaded:', {
              day: outfit.day_number,
              hasTop: !!outfitItems.top,
              topSignedUrl: outfitItems.top?.signedUrl?.substring(0, 50) + '...',
              hasBottom: !!outfitItems.bottom,
              hasShoes: !!outfitItems.shoes,
            });
            return outfitItems;
          })
        );
        setOutfits(loadedOutfits);
      } else {
        // Generate new outfits
        await generateOutfitsForTrip(suitcaseData, days, itemsWithUrls, user.id);
      }
    } catch (error) {
      console.error("Error loading suitcase:", error);
      toast({
        title: "Error",
        description: "Failed to load suitcase details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadItem = async (itemId: string | null, items: WardrobeItem[]) => {
    if (!itemId) return null;
    const item = items.find(item => item.id === itemId) || null;
    console.log('📦 Loading item:', {
      itemId,
      found: !!item,
      category: item?.category,
      hasImageUrl: !!item?.image_url,
      hasSignedUrl: !!item?.signedUrl,
      imageUrl: item?.image_url,
      signedUrl: item?.signedUrl?.substring(0, 50) + '...',
    });
    return item;
  };

  const generateOutfitsForTrip = async (
    suitcaseData: Suitcase,
    days: number,
    items: WardrobeItem[],
    userId: string
  ) => {
    setGenerating(true);
    try {
      const startDate = new Date(suitcaseData.start_date);
      const newOutfits: DayOutfit[] = [];
      const outfitsToSave = [];
      
      // Track used items to maximize variety
      const usedItems = new Set<string>();

      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Generate outfit for this day, avoiding recently used items
        const outfit = generateRandomOutfit(items, suitcaseData.weather_data?.forecasts?.[i], "casual", usedItems);
        
        // Add this outfit's items to the used set
        if (outfit.top) usedItems.add(outfit.top.id);
        if (outfit.bottom) usedItems.add(outfit.bottom.id);
        if (outfit.shoes) usedItems.add(outfit.shoes.id);
        if (outfit.dress) usedItems.add(outfit.dress.id);
        if (outfit.outerwear) usedItems.add(outfit.outerwear.id);
        if (outfit.accessory) usedItems.add(outfit.accessory.id);
        
        newOutfits.push({
          dayNumber: i + 1,
          date: currentDate,
          ...outfit,
          locked: new Set<string>(),
          occasion: "casual",
          occasionLabel: null,
          timeOfDay: null,
        });

        // Prepare DB record
        outfitsToSave.push({
          suitcase_id: id,
          user_id: userId,
          day_number: i + 1,
          outfit_date: format(currentDate, 'yyyy-MM-dd'),
          top_item_id: outfit.top?.id || null,
          bottom_item_id: outfit.bottom?.id || null,
          shoes_item_id: outfit.shoes?.id || null,
          dress_item_id: outfit.dress?.id || null,
          outerwear_item_id: outfit.outerwear?.id || null,
          accessory_item_id: outfit.accessory?.id || null,
          occasion: "casual",
          occasion_label: null,
          time_of_day: null,
        });
      }

      // Save all outfits to database
      const { data: savedOutfits, error } = await supabase
        .from("suitcase_outfits")
        .insert(outfitsToSave)
        .select();

      if (error) throw error;

      // Update outfits with IDs from database
      savedOutfits.forEach((saved, index) => {
        newOutfits[index].id = saved.id;
      });

      setOutfits(newOutfits);
      toast({
        title: "Outfits generated!",
        description: `Created ${days} outfits for your trip`,
      });
    } catch (error) {
      console.error("Error generating outfits:", error);
      toast({
        title: "Error",
        description: "Failed to generate outfits",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const filterItemsByOccasion = (items: WardrobeItem[], occasion: string): WardrobeItem[] => {
    if (!items.length) return items;

    // Occasion-based keyword filters
    const occasionFilters: Record<string, { include: string[], exclude: string[] }> = {
      athletic: {
        include: ["athletic", "gym", "workout", "sports", "exercise", "running", "training", "casual", "t-shirt", "shorts", "trainers", "sneakers"],
        exclude: ["formal", "business", "dress", "suit", "elegant"]
      },
      work: {
        include: ["business", "professional", "formal", "smart", "casual", "dress", "office", "work", "blazer", "shirt", "trousers"],
        exclude: ["athletic", "gym", "beach", "swim"]
      },
      evening: {
        include: ["dress", "elegant", "stylish", "formal", "nice", "evening", "smart", "cocktail"],
        exclude: ["athletic", "gym", "casual"]
      },
      casual: {
        include: ["casual", "comfortable", "relaxed", "everyday", "t-shirt", "jeans"],
        exclude: ["formal", "athletic"]
      },
      formal: {
        include: ["formal", "dress", "suit", "elegant", "black tie", "cocktail", "gown"],
        exclude: ["casual", "athletic", "beach"]
      },
      beach: {
        include: ["beach", "swim", "shorts", "sandals", "casual", "summer", "light"],
        exclude: ["formal", "business", "work"]
      },
      physical_work: {
        include: ["durable", "practical", "casual", "jeans", "sturdy", "work"],
        exclude: ["delicate", "formal", "dress"]
      },
      date: {
        include: ["dress", "elegant", "stylish", "nice", "smart", "formal"],
        exclude: ["athletic", "gym"]
      },
      travel: {
        include: ["comfortable", "casual", "practical"],
        exclude: []
      }
    };

    const filter = occasionFilters[occasion] || occasionFilters.casual;
    
    const filtered = items.filter(item => {
      const analysis = (item.ai_analysis || "").toLowerCase();
      
      // Check if item has exclude keywords
      const hasExclude = filter.exclude.some(keyword => analysis.includes(keyword));
      if (hasExclude) return false;
      
      // Check if item has include keywords
      const hasInclude = filter.include.some(keyword => analysis.includes(keyword));
      return hasInclude;
    });

    // If filtering results in no items, return all items of that category (fallback)
    return filtered.length > 0 ? filtered : items;
  };

  const generateRandomOutfit = (items: WardrobeItem[], weatherData?: any, occasion: string = "casual", usedItemIds?: Set<string>) => {
    // Combine wardrobe items with wish list items if enabled
    const allItems = includeWishList ? [...items, ...wishListItems] : items;
    
    // First filter by category
    let tops = allItems.filter(item => item.category === "Top");
    let bottoms = allItems.filter(item => item.category === "Bottom");
    let shoes = allItems.filter(item => item.category === "Shoes");
    let dresses = allItems.filter(item => item.category === "Dress");
    let outerwear = allItems.filter(item => item.category === "Outerwear");
    let accessories = allItems.filter(item => item.category === "Accessory");

    // Filter out recently used items if tracking is enabled
    if (usedItemIds && usedItemIds.size > 0) {
      const filterUnused = (categoryItems: WardrobeItem[]) => {
        const unused = categoryItems.filter(item => !usedItemIds.has(item.id));
        // If we've used all items in this category, allow reuse
        return unused.length > 0 ? unused : categoryItems;
      };
      
      tops = filterUnused(tops);
      bottoms = filterUnused(bottoms);
      shoes = filterUnused(shoes);
      dresses = filterUnused(dresses);
      outerwear = filterUnused(outerwear);
      accessories = filterUnused(accessories);
    }

    // Then filter each category by occasion
    tops = filterItemsByOccasion(tops, occasion);
    bottoms = filterItemsByOccasion(bottoms, occasion);
    shoes = filterItemsByOccasion(shoes, occasion);
    dresses = filterItemsByOccasion(dresses, occasion);
    outerwear = filterItemsByOccasion(outerwear, occasion);
    accessories = filterItemsByOccasion(accessories, occasion);

    // Weather-aware logic
    const temp = weatherData?.temperature;
    const needsOuterwear = temp !== undefined && temp < 18;

    // Decide dress vs top+bottom
    if (dresses.length > 0 && Math.random() > 0.5) {
      return {
        dress: dresses[Math.floor(Math.random() * dresses.length)],
        top: null,
        bottom: null,
        shoes: shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null,
        outerwear: needsOuterwear && outerwear.length > 0 
          ? outerwear[Math.floor(Math.random() * outerwear.length)] 
          : null,
        accessory: accessories.length > 0 && Math.random() > 0.7
          ? accessories[Math.floor(Math.random() * accessories.length)]
          : null,
      };
    } else {
      return {
        dress: null,
        top: tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null,
        bottom: bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : null,
        shoes: shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null,
        outerwear: needsOuterwear && outerwear.length > 0
          ? outerwear[Math.floor(Math.random() * outerwear.length)]
          : null,
        accessory: accessories.length > 0 && Math.random() > 0.7
          ? accessories[Math.floor(Math.random() * accessories.length)]
          : null,
      };
    }
  };

  const shuffleOutfit = async (outfitId: string) => {
    const outfitIndex = outfits.findIndex(o => o.id === outfitId);
    if (outfitIndex === -1) return;
    
    const outfit = outfits[outfitIndex];
    const weather = suitcase?.weather_data?.forecasts?.[outfit.dayNumber - 1];
    
    // Generate new items for unlocked categories
    const newOutfit = { ...outfit };
    
    if (outfit.dress && !outfit.locked.has("Dress")) {
      const dresses = wardrobeItems.filter(i => i.category === "Dress" && i.id !== outfit.dress?.id);
      if (dresses.length > 0) {
        newOutfit.dress = dresses[Math.floor(Math.random() * dresses.length)];
        newOutfit.top = null;
        newOutfit.bottom = null;
      }
    } else {
      if (!outfit.locked.has("Top")) {
        const tops = wardrobeItems.filter(i => i.category === "Top" && i.id !== outfit.top?.id);
        if (tops.length > 0) newOutfit.top = tops[Math.floor(Math.random() * tops.length)];
      }
      if (!outfit.locked.has("Bottom")) {
        const bottoms = wardrobeItems.filter(i => i.category === "Bottom" && i.id !== outfit.bottom?.id);
        if (bottoms.length > 0) newOutfit.bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      }
    }

    if (!outfit.locked.has("Shoes")) {
      const shoes = wardrobeItems.filter(i => i.category === "Shoes" && i.id !== outfit.shoes?.id);
      if (shoes.length > 0) newOutfit.shoes = shoes[Math.floor(Math.random() * shoes.length)];
    }

    if (!outfit.locked.has("Outerwear") && outfit.outerwear) {
      const outerwear = wardrobeItems.filter(i => i.category === "Outerwear" && i.id !== outfit.outerwear?.id);
      if (outerwear.length > 0) newOutfit.outerwear = outerwear[Math.floor(Math.random() * outerwear.length)];
    }

    if (!outfit.locked.has("Accessory") && outfit.accessory) {
      const accessories = wardrobeItems.filter(i => i.category === "Accessory" && i.id !== outfit.accessory?.id);
      if (accessories.length > 0) newOutfit.accessory = accessories[Math.floor(Math.random() * accessories.length)];
    }

    // Update in state and database
    const updatedOutfits = [...outfits];
    updatedOutfits[outfitIndex] = newOutfit;
    setOutfits(updatedOutfits);

    if (outfit.id) {
      await supabase
        .from("suitcase_outfits")
        .update({
          top_item_id: newOutfit.top?.id || null,
          bottom_item_id: newOutfit.bottom?.id || null,
          shoes_item_id: newOutfit.shoes?.id || null,
          dress_item_id: newOutfit.dress?.id || null,
          outerwear_item_id: newOutfit.outerwear?.id || null,
          accessory_item_id: newOutfit.accessory?.id || null,
        })
        .eq("id", outfit.id);
    }
  };

  const toggleLock = (outfitId: string, category: string) => {
    const outfitIndex = outfits.findIndex(o => o.id === outfitId);
    if (outfitIndex === -1) return;
    
    const updatedOutfits = [...outfits];
    const locked = new Set(updatedOutfits[outfitIndex].locked);
    
    if (locked.has(category)) {
      locked.delete(category);
    } else {
      locked.add(category);
    }
    
    updatedOutfits[outfitIndex].locked = locked;
    setOutfits(updatedOutfits);
  };

  const handleSelectItem = (outfitId: string, category: string) => {
    setSelectedOutfitId(outfitId);
    setSelectItemCategory(category);
    setShowSelectItemDialog(true);
  };

  const handleItemSelected = async (selectedItem: WardrobeItem) => {
    if (!selectedOutfitId) return;

    const outfitIndex = outfits.findIndex(o => o.id === selectedOutfitId);
    if (outfitIndex === -1) return;

    const updatedOutfits = [...outfits];
    const categoryKey = selectItemCategory.toLowerCase() as keyof Omit<DayOutfit, 'id' | 'dayNumber' | 'date' | 'locked' | 'occasion' | 'occasionLabel' | 'timeOfDay'>;
    
    if (categoryKey === 'top' || categoryKey === 'bottom' || categoryKey === 'shoes' || 
        categoryKey === 'dress' || categoryKey === 'outerwear' || categoryKey === 'accessory') {
      updatedOutfits[outfitIndex][categoryKey] = selectedItem;
    }
    
    setOutfits(updatedOutfits);

    // Update in database
    const updateData: Record<string, string> = {};
    updateData[`${categoryKey}_item_id`] = selectedItem.id;

    await supabase
      .from("suitcase_outfits")
      .update(updateData)
      .eq("id", selectedOutfitId);

    toast({
      title: "Item updated",
      description: `${selectItemCategory} changed successfully`,
    });

    setShowSelectItemDialog(false);
    setSelectedOutfitId(null);
  };

  const deleteOutfit = async (outfitId: string) => {
    if (!confirm("Delete this outfit?")) return;

    try {
      await supabase.from("suitcase_outfits").delete().eq("id", outfitId);
      setOutfits(outfits.filter(o => o.id !== outfitId));
      toast({ title: "Outfit deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete outfit",
        variant: "destructive",
      });
    }
  };

  const saveOutfitToFavorites = async (outfit: DayOutfit) => {
    const hasCoreItems = (outfit.dress || (outfit.top && outfit.bottom)) && outfit.shoes;
    if (!hasCoreItems) {
      toast({
        title: "Cannot save",
        description: "Outfit must have core items to save",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("favorite_outfits")
        .insert({
          user_id: user.id,
          top_item_id: outfit.top?.id || null,
          bottom_item_id: outfit.bottom?.id || null,
          shoes_item_id: outfit.shoes?.id || null,
          dress_item_id: outfit.dress?.id || null,
          outerwear_item_id: outfit.outerwear?.id || null,
          accessory_item_id: outfit.accessory?.id || null,
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Outfit added to your favourites",
      });
    } catch (error) {
      console.error("Error saving outfit:", error);
      toast({
        title: "Error",
        description: "Failed to save outfit",
        variant: "destructive",
      });
    }
  };

  const handleAddOutfit = async (occasion: string, occasionLabel: string, timeOfDay: string) => {
    console.log("🚀 Starting handleAddOutfit", { occasion, occasionLabel, timeOfDay, selectedDay });
    console.log("📊 Current state:", { 
      hasSuitcase: !!suitcase, 
      hasId: !!id,
      wardrobeItemsCount: wardrobeItems.length,
      outfitsCount: outfits.length,
      selectedDay 
    });
    
    if (!suitcase || !id) {
      console.error("❌ Missing suitcase or id", { suitcase, id });
      throw new Error("Missing trip information. Please refresh the page.");
    }

    if (wardrobeItems.length === 0) {
      console.error("❌ No wardrobe items available");
      throw new Error("No wardrobe items found. Please add items to your wardrobe first.");
    }
    
    try {
      console.log("🔐 Checking authentication...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ No user found");
        throw new Error("Not authenticated. Please log in again.");
      }
      console.log("✓ User authenticated", user.id);

      const dayOutfit = outfits.find(o => o.dayNumber === selectedDay);
      if (!dayOutfit) {
        console.error("❌ Day outfit not found", { selectedDay, outfits });
        throw new Error("Day not found in your trip plan.");
      }
      console.log("✓ Found day outfit", dayOutfit);

      const weather = suitcase.weather_data?.forecasts?.[selectedDay - 1];
      console.log("🌤️ Weather for day", weather);
      
      console.log("🎨 Calling generateRandomOutfit with:", {
        itemsCount: wardrobeItems.length,
        occasion,
        hasWeather: !!weather
      });
      const newOutfitData = generateRandomOutfit(wardrobeItems, weather, occasion);
      console.log("✓ Generated outfit data", newOutfitData);

      // Check if we got a valid outfit
      const hasItems = newOutfitData.dress || (newOutfitData.top && newOutfitData.bottom) || newOutfitData.top || newOutfitData.bottom;
      
      if (!hasItems) {
        console.warn("⚠️ No matching items found for occasion", { occasion, wardrobeItems: wardrobeItems.length });
        const occasionNames: Record<string, string> = {
          work: "work/professional",
          evening: "evening event",
          athletic: "gym/athletic",
          formal: "formal/black tie",
          date: "date night",
          beach: "beach/pool",
          physical_work: "physical work",
          travel: "travel",
          casual: "casual",
        };
        
        throw new Error(`No matching items found for ${occasionNames[occasion] || occasion}. Add some items to your wardrobe!`);
      }
      console.log("✓ Outfit has valid items");

      console.log("💾 Saving outfit to database...");
      const { data: savedOutfit, error } = await supabase
        .from("suitcase_outfits")
        .insert({
          suitcase_id: id,
          user_id: user.id,
          day_number: selectedDay,
          outfit_date: format(dayOutfit.date, 'yyyy-MM-dd'),
          top_item_id: newOutfitData.top?.id || null,
          bottom_item_id: newOutfitData.bottom?.id || null,
          shoes_item_id: newOutfitData.shoes?.id || null,
          dress_item_id: newOutfitData.dress?.id || null,
          outerwear_item_id: newOutfitData.outerwear?.id || null,
          accessory_item_id: newOutfitData.accessory?.id || null,
          occasion,
          occasion_label: occasionLabel || null,
          time_of_day: timeOfDay === "any" ? null : timeOfDay,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      console.log("✓ Outfit saved to database", savedOutfit);

      const newOutfit: DayOutfit = {
        id: savedOutfit.id,
        dayNumber: selectedDay,
        date: dayOutfit.date,
        ...newOutfitData,
        locked: new Set<string>(),
        occasion,
        occasionLabel: occasionLabel || null,
        timeOfDay: timeOfDay || null,
      };

      console.log("✓ Adding outfit to state", newOutfit);
      setOutfits([...outfits, newOutfit]);
      
      console.log("🎉 Outfit successfully added!");
      toast({ 
        title: "Outfit added!",
        description: `Added ${occasion} outfit for Day ${selectedDay}`
      });
    } catch (error) {
      console.error("❌ Error adding outfit:", error);
      // Re-throw with clear message so modal can display it
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to add outfit. Please try again.");
    }
  };

  const generatePackingList = () => {
    const itemMap = new Map<string, PackingItem>();

    outfits.forEach((outfit) => {
      const items = [
        outfit.top,
        outfit.bottom,
        outfit.shoes,
        outfit.dress,
        outfit.outerwear,
        outfit.accessory,
      ].filter(Boolean) as WardrobeItem[];

      const occasionText = outfit.occasionLabel || 
        (outfit.occasion === "casual" ? "" : outfit.occasion.charAt(0).toUpperCase() + outfit.occasion.slice(1));

      items.forEach(item => {
        const dayInfo = {
          dayNumber: outfit.dayNumber,
          occasion: outfit.occasion,
          occasionLabel: occasionText,
        };

        if (itemMap.has(item.id)) {
          itemMap.get(item.id)!.days.push(dayInfo);
        } else {
          itemMap.set(item.id, {
            id: item.id,
            category: item.category,
            imageUrl: item.signedUrl || item.image_url,
            days: [dayInfo],
          });
        }
      });
    });

    setPackingList(Array.from(itemMap.values()));
  };

  const togglePackingItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
    saveCheckedState(newChecked);
  };

  const getWeatherEmoji = (condition: string) => {
    if (!condition) return '☁️';
    switch (condition.toLowerCase()) {
      case 'clear': return '☀️';
      case 'clouds': return '⛅';
      case 'rain':
      case 'drizzle': return '🌧️';
      case 'snow': return '❄️';
      case 'thunderstorm': return '⛈️';
      default: return '☁️';
    }
  };

  const getOccasionEmoji = (occasion: string) => {
    const emojiMap: Record<string, string> = {
      work: "👔",
      casual: "👕",
      evening: "🌙",
      athletic: "🏃",
      formal: "🎩",
      date: "💑",
      beach: "🏖️",
      physical_work: "🔨",
      travel: "✈️",
      custom: "✏️",
    };
    return emojiMap[occasion] || "👕";
  };

  const getOccasionDisplay = (outfit: DayOutfit) => {
    if (outfit.occasionLabel) {
      return `${getOccasionEmoji(outfit.occasion)} ${outfit.occasionLabel}`;
    }
    if (outfit.occasion === "casual") {
      return null; // Don't show label for default casual outfits
    }
    const occasionNames: Record<string, string> = {
      work: "Work/Professional",
      evening: "Evening Event",
      athletic: "Athletic/Gym",
      formal: "Formal/Black Tie",
      date: "Date Night",
      beach: "Beach/Pool",
      physical_work: "Physical Work",
      travel: "Travel/Commute",
    };
    return `${getOccasionEmoji(outfit.occasion)} ${occasionNames[outfit.occasion] || outfit.occasion}`;
  };

  const deleteSuitcase = async () => {
    if (!confirm("Delete this plan? This cannot be undone.")) return;

    try {
      console.log("🗑️ Deleting suitcase", id);
      await supabase.from("suitcases").delete().eq("id", id);
      toast({ title: "Plan deleted" });
      console.log("✓ Plan deleted, navigating to /suitcases");
      navigate("/suitcases", { replace: true });
    } catch (error) {
      console.error("❌ Error deleting plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!suitcase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Plan not found</h1>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              console.log("⬅️ Back button clicked (not found), navigating to /suitcases");
              try {
                navigate("/suitcases");
              } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/suitcases";
              }
            }}
            className="min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  const packedCount = checkedItems.size;
  const totalItems = packingList.length;
  const packedPercentage = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              console.log("⬅️ Back button clicked, navigating to /suitcases");
              try {
                navigate("/suitcases");
              } catch (error) {
                console.error("Navigation error:", error);
                // Fallback to direct navigation if react-router fails
                window.location.href = "/suitcases";
              }
            }}
            className="mb-4 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{suitcase.trip_name}</h1>
              <p className="text-lg text-muted-foreground">
                {suitcase.destination} • {format(new Date(suitcase.start_date), 'MMM d')} - {format(new Date(suitcase.end_date), 'MMM d, yyyy')}
              </p>
              <Badge variant="secondary" className="mt-2">
                {suitcase.trip_type}
              </Badge>
            </div>
            <Button variant="destructive" onClick={deleteSuitcase}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Trip
            </Button>
          </div>
        </div>

        {/* Weather forecast strip */}
        {suitcase.weather_data?.forecasts && (
          <Card className="p-4 mb-8">
            <div className="flex gap-4 overflow-x-auto">
              {suitcase.weather_data.forecasts.slice(0, outfits.length).map((day: any, index: number) => (
                <div key={index} className="flex flex-col items-center min-w-[80px] text-center">
                  <p className="text-xs text-muted-foreground mb-1">Day {index + 1}</p>
                  <span className="text-2xl mb-1">{getWeatherEmoji(day.condition)}</span>
                  <p className="text-sm font-semibold">{day.temperature}°C</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Wish List Toggle */}
        <Card className="p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Include Wish List items</span>
              {includeWishList && wishListItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{wishListItems.length} items
                </Badge>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWishList}
                onChange={(e) => {
                  setIncludeWishList(e.target.checked);
                  if (e.target.checked) {
                    toast({
                      title: "Wish List enabled",
                      description: "Outfits can now include items you want to buy!",
                    });
                    // Reload suitcase to fetch wish list items
                    loadSuitcase();
                  }
                }}
                className="w-5 h-5 rounded border-border"
              />
            </label>
          </div>
          {includeWishList && wishListItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Outfits with wish list items will show you what you're missing to complete the look
            </p>
          )}
        </Card>

        {/* Daily outfits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Daily Outfits</h2>
          
          {/* Empty wardrobe banner */}
          {wardrobeItems.length === 0 && !loading && (
            <Card className="p-6 md:p-8 mb-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">Add clothes to generate outfits</h3>
                  <p className="text-muted-foreground">
                    Upload items to your wardrobe and we'll create perfect outfits for each day of your trip
                  </p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate("/wardrobe")}
                  className="flex-shrink-0 min-h-[44px] touch-manipulation"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Items
                </Button>
              </div>
            </Card>
          )}
          
          {loading && (
            <div className="space-y-8">
              {[1, 2, 3].map((day) => (
                <div key={day} className="space-y-4">
                  <div>
                    <Skeleton className="h-7 w-20 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-5 w-32" />
                      <div className="flex gap-2">
                        <Skeleton className="h-10 w-10 rounded" />
                        <Skeleton className="h-10 w-10 rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="space-y-2">
                          <Skeleton className="aspect-square rounded-lg" />
                          <Skeleton className="h-3 w-12 mx-auto" />
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )}
          
          {generating && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Generating outfits for your trip...</p>
            </div>
          )}

          {!loading && !generating && <div className="space-y-8">
            {Array.from(new Set(outfits.map(o => o.dayNumber))).map((dayNum) => {
              const dayOutfits = outfits.filter(o => o.dayNumber === dayNum);
              const firstOutfit = dayOutfits[0];
              const weather = suitcase?.weather_data?.forecasts?.[dayNum - 1];

              return (
                <div key={dayNum} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl">Day {dayNum}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(firstOutfit.date, 'EEEE, MMM d')}
                        {weather && (
                          <span className="ml-2">
                            • {getWeatherEmoji(weather.condition)} {weather.temperature}°C
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dayOutfits.map((outfit) => {
                      // Log outfit data for debugging
                      if (outfit.top) {
                        console.log('🎯 Rendering outfit with top:', {
                          outfitId: outfit.id,
                          day: outfit.dayNumber,
                          hasTop: !!outfit.top,
                          topId: outfit.top.id,
                          topCategory: outfit.top.category,
                          topImageUrl: outfit.top.image_url,
                          topSignedUrl: outfit.top.signedUrl?.substring(0, 50) + '...',
                        });
                      }
                      
                      return (
                      <Card key={outfit.id} className="p-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            {getOccasionDisplay(outfit) && (
                              <p className="text-sm font-medium mb-1">
                                {getOccasionDisplay(outfit)}
                              </p>
                            )}
                            {outfit.timeOfDay && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {outfit.timeOfDay}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveOutfitToFavorites(outfit)}
                              className="min-h-[44px] touch-manipulation"
                              title="Save to favourites"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!outfit.id) return;
                                const outfitIndex = outfits.findIndex(o => o.id === outfit.id);
                                if (outfitIndex === -1) return;
                                
                                const updatedOutfits = [...outfits];
                                updatedOutfits[outfitIndex].locked = new Set<string>();
                                setOutfits(updatedOutfits);
                                
                                toast({
                                  title: "All items unlocked",
                                  description: "All items in this outfit are now available for shuffling"
                                });
                              }}
                              disabled={outfit.locked.size === 0}
                              className="min-h-[44px] touch-manipulation"
                            >
                              🔓
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => outfit.id && shuffleOutfit(outfit.id)}
                              className="min-h-[44px] touch-manipulation"
                            >
                              <Shuffle className="w-4 h-4" />
                            </Button>
                            {dayOutfits.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => outfit.id && deleteOutfit(outfit.id)}
                                className="min-h-[44px] touch-manipulation"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {outfit.dress ? (
                            <OutfitItemCard
                              item={outfit.dress}
                              category="Dress"
                              locked={outfit.locked.has("Dress")}
                              onToggleLock={() => outfit.id && toggleLock(outfit.id, "Dress")}
                              onSelect={() => outfit.id && handleSelectItem(outfit.id, "Dress")}
                            />
                          ) : (
                            <>
                              {outfit.top && (
                                <OutfitItemCard
                                  item={outfit.top}
                                  category="Top"
                                  locked={outfit.locked.has("Top")}
                                  onToggleLock={() => outfit.id && toggleLock(outfit.id, "Top")}
                                  onSelect={() => outfit.id && handleSelectItem(outfit.id, "Top")}
                                />
                              )}
                              {outfit.bottom && (
                                <OutfitItemCard
                                  item={outfit.bottom}
                                  category="Bottom"
                                  locked={outfit.locked.has("Bottom")}
                                  onToggleLock={() => outfit.id && toggleLock(outfit.id, "Bottom")}
                                  onSelect={() => outfit.id && handleSelectItem(outfit.id, "Bottom")}
                                />
                              )}
                            </>
                          )}
                          {outfit.shoes && (
                            <OutfitItemCard
                              item={outfit.shoes}
                              category="Shoes"
                              locked={outfit.locked.has("Shoes")}
                              onToggleLock={() => outfit.id && toggleLock(outfit.id, "Shoes")}
                              onSelect={() => outfit.id && handleSelectItem(outfit.id, "Shoes")}
                            />
                          )}
                          {outfit.outerwear && (
                            <OutfitItemCard
                              item={outfit.outerwear}
                              category="Outerwear"
                              locked={outfit.locked.has("Outerwear")}
                              onToggleLock={() => outfit.id && toggleLock(outfit.id, "Outerwear")}
                              onSelect={() => outfit.id && handleSelectItem(outfit.id, "Outerwear")}
                            />
                          )}
                          {outfit.accessory && (
                            <OutfitItemCard
                              item={outfit.accessory}
                              category="Accessory"
                              locked={outfit.locked.has("Accessory")}
                              onToggleLock={() => outfit.id && toggleLock(outfit.id, "Accessory")}
                              onSelect={() => outfit.id && handleSelectItem(outfit.id, "Accessory")}
                            />
                          )}
                        </div>
                      </Card>
                    )})}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      console.log("➕ Add outfit button clicked", { 
                        dayNum, 
                        wardrobeItemsCount: wardrobeItems.length,
                        outfitsCount: outfits.length 
                      });
                      
                      if (wardrobeItems.length === 0) {
                        toast({
                          title: "No wardrobe items",
                          description: "Please add items to your wardrobe first.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      setSelectedDay(dayNum);
                      setAddOutfitModalOpen(true);
                      console.log("✓ Modal state set to open for day", dayNum);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Outfit for Day {dayNum}
                  </Button>
                </div>
              );
            })}
          </div>}
        </div>

        {/* Packing checklist */}
        {packingList.length > 0 && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Packing Checklist</h2>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  {packedCount} of {totalItems} items packed
                </p>
                <Badge variant={packedPercentage === 100 ? "default" : "secondary"}>
                  {packedPercentage}% Complete
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {packingList.map((item) => (
                <PackingListItem
                  key={item.id}
                  item={item}
                  isChecked={checkedItems.has(item.id)}
                  onToggle={() => togglePackingItem(item.id)}
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      <AddOutfitModal
        open={addOutfitModalOpen}
        onClose={() => {
          console.log("🚪 Closing modal");
          setAddOutfitModalOpen(false);
        }}
        onAdd={handleAddOutfit}
        dayNumber={selectedDay}
      />

      <SelectWardrobeItemDialog
        open={showSelectItemDialog}
        onOpenChange={setShowSelectItemDialog}
        category={selectItemCategory}
        wardrobeItems={wardrobeItems}
        wishListItems={includeWishList ? wishListItems : []}
        onSelect={handleItemSelected}
      />
    </div>
  );
};

const PackingListItem = ({ item, isChecked, onToggle }: { 
  item: PackingItem & { days: { dayNumber: number; occasionLabel: string | null }[] }; 
  isChecked: boolean; 
  onToggle: () => void;
}) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
      <Checkbox checked={isChecked} onCheckedChange={onToggle} />
      <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.category}
            className="w-full h-full object-cover"
            onError={() => {
              console.error('Packing item image failed to load:', item.imageUrl);
              setImgError(true);
            }}
          />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${isChecked ? "line-through text-muted-foreground" : ""}`}>
          {item.category}
        </p>
        <p className="text-sm text-muted-foreground">
          Needed on: {item.days.map((d, idx) => (
            <span key={idx}>
              {idx > 0 && ", "}
              Day {d.dayNumber}
              {d.occasionLabel && ` (${d.occasionLabel})`}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

interface OutfitItemCardProps {
  item: WardrobeItem;
  category: string;
  locked: boolean;
  onToggleLock: () => void;
  onSelect: () => void;
}

const OutfitItemCard = ({ item, category, locked, onToggleLock, onSelect }: OutfitItemCardProps) => {
  // Log the item data for debugging
  console.log('🎨 Rendering OutfitItemCard:', {
    category,
    hasItem: !!item,
    hasSignedUrl: !!item?.signedUrl,
    hasImageUrl: !!item?.image_url,
    signedUrlPreview: item?.signedUrl?.substring(0, 50) + '...',
    imageUrlPreview: item?.image_url?.substring(0, 50),
  });
  
  return (
    <div className="relative group">
      <div 
        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        onClick={onSelect}
      >
        <WardrobeItemImage
          imageUrl={item.image_url}
          displayUrl={item.signedUrl}
          category={category}
          itemId={item.id}
          className="w-full h-full object-cover"
          isWishListItem={item.isWishListItem}
        />
      </div>
      <Button
        variant="secondary"
        size="icon"
        aria-label={locked ? "Unlock item" : "Lock item"}
        className={`
          absolute top-2 right-2 min-w-[48px] min-h-[48px] 
          md:opacity-0 md:group-hover:opacity-100 transition-all touch-manipulation
          active:scale-90 z-10
          ${locked ? 'bg-[hsl(var(--coral))]/90 text-white' : 'bg-background/90'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggleLock();
        }}
      >
        {locked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
      </Button>
      <p className="text-xs text-center mt-1 text-muted-foreground">{category}</p>
    </div>
  );
};

export default SuitcaseDetail;
