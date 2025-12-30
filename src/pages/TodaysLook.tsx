import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock, Unlock, Shuffle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";
import { getSignedUrl } from "@/lib/storageUtils";
import { HorizontalItemBrowser } from "@/components/HorizontalItemBrowser";

import { SelectWardrobeItemDialog } from "@/components/SelectWardrobeItemDialog";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
  isWishListItem?: boolean;
}

interface Outfit {
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  dress: WardrobeItem | null;
  outerwear: WardrobeItem | null;
  accessory: WardrobeItem | null;
}

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  city: string;
}

const TodaysLook = () => {
  const [outfit, setOutfit] = useState<Outfit>({ 
    top: null, 
    bottom: null, 
    shoes: null, 
    dress: null, 
    outerwear: null, 
    accessory: null 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showOuterwear, setShowOuterwear] = useState(true);
  const [hasOuterwearInWardrobe, setHasOuterwearInWardrobe] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lockedCategories, setLockedCategories] = useState<Set<string>>(new Set());
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableItemsForCategory, setAvailableItemsForCategory] = useState<WardrobeItem[]>([]);
  const [showHorizontalBrowser, setShowHorizontalBrowser] = useState(false);
  const [includeWishList, setIncludeWishList] = useState(false);
  const [wishListItems, setWishListItems] = useState<WardrobeItem[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSelectItemDialog, setShowSelectItemDialog] = useState(false);
  const [selectItemCategory, setSelectItemCategory] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const getWeatherEmoji = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '⛅';
      case 'rain':
      case 'drizzle':
        return '🌧️';
      case 'snow':
        return '❄️';
      case 'thunderstorm':
        return '⛈️';
      default:
        return '☁️';
    }
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      // Request location permission
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Call edge function to fetch weather
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { lat: latitude, lon: longitude },
      });

      if (error) throw error;

      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Weather unavailable",
        description: "Could not fetch weather data. Please enable location access.",
        variant: "destructive",
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const generateOutfit = async (userId?: string) => {
    setLoading(true);
    setError(null);

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Outfit generation timed out after 30 seconds')), 30000);
    });

    try {
      // Race between actual generation and timeout
      await Promise.race([
        (async () => {
          // Use cached user ID if provided, otherwise fetch
          let user_id = userId;
          if (!user_id) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              throw new Error("User not authenticated");
            }
            user_id = user.id;
          }

          // Use cached wardrobe items if available, otherwise fetch
          let items = wardrobeItems;
          if (items.length === 0) {
            const { data: fetchedItems, error } = await supabase
              .from("wardrobe_items")
              .select("*")
              .eq("user_id", user_id)
              .order("created_at", { ascending: false });

            if (error) throw error;
            
            if (!fetchedItems || fetchedItems.length === 0) {
              throw new Error("No wardrobe items found. Please add some items to your wardrobe first.");
            }
            
            // Generate signed URLs for all items
            const itemsWithUrls = await Promise.all(
              fetchedItems.map(async (item) => {
                const signedUrl = await getSignedUrl(item.image_url);
                return { ...item, signedUrl, isWishListItem: false };
              })
            );
            
            items = itemsWithUrls;
            setWardrobeItems(items);
          }

          // Fetch wish list items if toggle is enabled
          if (includeWishList) {
            const { data: wishItems, error: wishError } = await supabase
              .from("wish_list_items")
              .select("*")
              .eq("user_id", user_id);

            if (!wishError && wishItems) {
              const wishItemsWithUrls = await Promise.all(
                wishItems.map(async (item) => {
                  const signedUrl = await getSignedUrl(item.image_url);
                  return { 
                    ...item, 
                    signedUrl, 
                    isWishListItem: true 
                  };
                })
              );
              setWishListItems(wishItemsWithUrls);
              items = [...items, ...wishItemsWithUrls];
            }
          }

          // Step 1: Filter items by category
          const tops = items?.filter(item => item.category === "Top") || [];
          const bottoms = items?.filter(item => item.category === "Bottom") || [];
          const shoes = items?.filter(item => item.category === "Shoes") || [];
          const dresses = items?.filter(item => item.category === "Dress") || [];
          const accessories = items?.filter(item => item.category === "Accessory") || [];
          const outerwear = items?.filter(item => item.category === "Outerwear") || [];

          // Track if user has outerwear in wardrobe
          setHasOuterwearInWardrobe(outerwear.length > 0);

          // Get weather data for smart filtering
          const temperature = weather?.temperature;
          const isRaining = weather?.condition?.toLowerCase().includes('rain') || weather?.condition?.toLowerCase().includes('drizzle');

          // Step 2: Weather-based item selection logic
          let newOutfit: Outfit;
          
          // Select shoes (weather-aware)
          const randomShoes = shoes.length > 0 ? shoes[Math.floor(Math.random() * shoes.length)] : null;

          // Step 3: Build outfit - Dress OR Top+Bottom, plus Shoes
          if (dresses.length > 0 && Math.random() > 0.4) {
            // Dress outfit
            const randomDress = dresses[Math.floor(Math.random() * dresses.length)];
            newOutfit = {
              top: null,
              bottom: null,
              dress: randomDress,
              shoes: randomShoes,
              outerwear: null,
              accessory: null,
            };
          } else {
            // Top + Bottom outfit
            const randomTop = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null;
            const randomBottom = bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : null;
            newOutfit = {
              top: randomTop,
              bottom: randomBottom,
              dress: null,
              shoes: randomShoes,
              outerwear: null,
              accessory: null,
            };
          }

          // Step 4: Weather-based outerwear logic
          let shouldAddOuterwear = false;
          let outerwearRequired = false;

          if (temperature !== undefined) {
            if (temperature < 12) {
              // Cold weather - outerwear required
              shouldAddOuterwear = true;
              outerwearRequired = true;
            } else if (temperature < 18) {
              // Cool weather - outerwear recommended
              shouldAddOuterwear = true;
              outerwearRequired = false;
            } else if (isRaining) {
              // Rain - outerwear recommended even if warm
              shouldAddOuterwear = true;
              outerwearRequired = false;
            } else {
              // Warm weather - no outerwear
              shouldAddOuterwear = false;
              outerwearRequired = false;
            }
          }

          // Add outerwear based on weather conditions
          if (shouldAddOuterwear && outerwear.length > 0) {
            newOutfit.outerwear = outerwear[Math.floor(Math.random() * outerwear.length)];
            setShowOuterwear(true);
          } else {
            newOutfit.outerwear = null;
            setShowOuterwear(false);
          }

          // Step 5: Add optional accessories
          if (accessories.length > 0 && Math.random() < 0.3) {
            newOutfit.accessory = accessories[Math.floor(Math.random() * accessories.length)];
          }

          setOutfit(newOutfit);

          // Step 5: Save to history - save if we have core items (dress OR top+bottom) AND shoes
          const hasCoreItems = (newOutfit.dress || (newOutfit.top && newOutfit.bottom)) && newOutfit.shoes;
          if (hasCoreItems && user_id) {
            // Run all database operations in parallel for speed
            Promise.all([
              // Insert outfit history
              supabase.from("outfit_history").insert({
                user_id: user_id,
                top_item_id: newOutfit.top?.id || null,
                bottom_item_id: newOutfit.bottom?.id || null,
                shoes_item_id: newOutfit.shoes?.id || null,
                dress_item_id: newOutfit.dress?.id || null,
                outerwear_item_id: newOutfit.outerwear?.id || null,
                accessory_item_id: newOutfit.accessory?.id || null,
              }),
              // Track analytics event
              supabase.from("analytics_events").insert({
                user_id: user_id,
                event_type: "outfit_generated",
                event_data: {
                  has_dress: !!newOutfit.dress,
                  has_top: !!newOutfit.top,
                  has_bottom: !!newOutfit.bottom,
                  has_shoes: !!newOutfit.shoes,
                  has_accessory: !!newOutfit.accessory,
                  has_outerwear: !!newOutfit.outerwear,
                },
              }),
            ]).catch(err => console.error("Error saving outfit data:", err));

            // Clean up old history in background (non-blocking)
            supabase
              .from("outfit_history")
              .select("id")
              .eq("user_id", user_id)
              .order("created_at", { ascending: false })
              .range(30, 1000)
              .then(({ data: history }) => {
                if (history && history.length > 0) {
                  const idsToDelete = history.map(h => h.id);
                  supabase
                    .from("outfit_history")
                    .delete()
                    .in("id", idsToDelete)
                    .catch(err => console.error("Error cleaning history:", err));
                }
              });
          }
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error("Error generating outfit:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate outfit. Please try again.";
      setError(errorMessage);
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddItemDialog = (category: string) => {
    const categoryItems = wardrobeItems.filter(item => item.category === category);
    if (categoryItems.length === 0) {
      toast({
        title: "No items found",
        description: `You don't have any ${category.toLowerCase()} items in your wardrobe`,
        variant: "destructive",
      });
      return;
    }
    setSelectedCategory(category);
    setAvailableItemsForCategory(categoryItems);
    setShowAddItemDialog(true);
  };

  const openSelectItemDialog = (category: string) => {
    setSelectItemCategory(category);
    setShowSelectItemDialog(true);
  };

  const handleSelectItemFromDialog = (item: WardrobeItem) => {
    const categoryKey = item.category.toLowerCase() as keyof Outfit;
    setOutfit(prev => ({
      ...prev,
      [categoryKey]: item,
    }));
    
    // Show outerwear slot if outerwear is selected
    if (item.category === "Outerwear") {
      setShowOuterwear(true);
    }
    
    toast({
      title: "Item selected!",
      description: `${item.category} updated in your outfit`,
    });
  };

  const addItemToOutfit = (item: WardrobeItem) => {
    const categoryKey = item.category.toLowerCase() as keyof Outfit;
    setOutfit(prev => ({
      ...prev,
      [categoryKey]: item,
    }));
    
    // Show outerwear slot if outerwear is added
    if (item.category === "Outerwear") {
      setShowOuterwear(true);
    }
    
    setShowAddItemDialog(false);
    toast({
      title: "Item added",
      description: `${item.category} added to your outfit`,
    });
  };

  const removeItemFromOutfit = (category: string) => {
    const categoryKey = category.toLowerCase() as keyof Outfit;
    setOutfit(prev => ({
      ...prev,
      [categoryKey]: null,
    }));
    
    // Also unlock if it was locked
    setLockedCategories(prev => {
      const newSet = new Set(prev);
      newSet.delete(category);
      return newSet;
    });
    
    toast({
      title: "Item removed",
      description: `${category} removed from outfit`,
    });
  };

  const openHorizontalBrowser = () => {
    setShowHorizontalBrowser(true);
  };

  const handleSelectItem = (category: string, item: WardrobeItem) => {
    const categoryKey = category.toLowerCase() as keyof Outfit;
    setOutfit(prev => ({
      ...prev,
      [categoryKey]: item,
    }));
    
    // Show outerwear slot if outerwear is added
    if (category === "Outerwear") {
      setShowOuterwear(true);
    }
    
    toast({
      title: "Item selected!",
      description: `${category} updated in your outfit`,
    });
  };

  const toggleLock = (category: string) => {
    setLockedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
        toast({
          title: "Unlocked",
          description: `${category} can now change with AI Assist`,
        });
      } else {
        newSet.add(category);
        toast({
          title: "Locked",
          description: `${category} will stay in your outfit`,
        });
      }
      return newSet;
    });
  };

  const shuffleUnlockedItems = async () => {
    setShuffling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get available items by category
      const tops = wardrobeItems.filter(item => item.category === "Top");
      const bottoms = wardrobeItems.filter(item => item.category === "Bottom");
      const shoes = wardrobeItems.filter(item => item.category === "Shoes");
      const dresses = wardrobeItems.filter(item => item.category === "Dress");
      const accessories = wardrobeItems.filter(item => item.category === "Accessory");
      const outerwear = wardrobeItems.filter(item => item.category === "Outerwear");

      const newOutfit: Outfit = { ...outfit };

      // Shuffle dress or top+bottom combo (if unlocked)
      if (outfit.dress) {
        // Currently showing a dress
        if (!lockedCategories.has("Dress") && dresses.length > 1) {
          // Shuffle to a different dress
          const availableDresses = dresses.filter(d => d.id !== outfit.dress?.id);
          if (availableDresses.length > 0) {
            newOutfit.dress = availableDresses[Math.floor(Math.random() * availableDresses.length)];
          }
        }
      } else {
        // Currently showing top + bottom
        if (!lockedCategories.has("Top") && tops.length > 1) {
          const availableTops = tops.filter(t => t.id !== outfit.top?.id);
          if (availableTops.length > 0) {
            newOutfit.top = availableTops[Math.floor(Math.random() * availableTops.length)];
          }
        }
        if (!lockedCategories.has("Bottom") && bottoms.length > 1) {
          const availableBottoms = bottoms.filter(b => b.id !== outfit.bottom?.id);
          if (availableBottoms.length > 0) {
            newOutfit.bottom = availableBottoms[Math.floor(Math.random() * availableBottoms.length)];
          }
        }
      }

      // Shuffle shoes (if unlocked)
      if (!lockedCategories.has("Shoes") && shoes.length > 1) {
        const availableShoes = shoes.filter(s => s.id !== outfit.shoes?.id);
        if (availableShoes.length > 0) {
          newOutfit.shoes = availableShoes[Math.floor(Math.random() * availableShoes.length)];
        }
      }

      // Shuffle outerwear (if unlocked and showing)
      if (showOuterwear && !lockedCategories.has("Outerwear") && outerwear.length > 1) {
        const availableOuterwear = outerwear.filter(o => o.id !== outfit.outerwear?.id);
        if (availableOuterwear.length > 0) {
          newOutfit.outerwear = availableOuterwear[Math.floor(Math.random() * availableOuterwear.length)];
        }
      }

      // Shuffle accessory (if unlocked and showing)
      if (outfit.accessory && !lockedCategories.has("Accessory") && accessories.length > 1) {
        const availableAccessories = accessories.filter(a => a.id !== outfit.accessory?.id);
        if (availableAccessories.length > 0) {
          newOutfit.accessory = availableAccessories[Math.floor(Math.random() * availableAccessories.length)];
        }
      }

      setOutfit(newOutfit);

      // Save to history
      const hasCoreItems = (newOutfit.dress || (newOutfit.top && newOutfit.bottom)) && newOutfit.shoes;
      if (hasCoreItems) {
        await supabase.from("outfit_history").insert({
          user_id: user.id,
          top_item_id: newOutfit.top?.id || null,
          bottom_item_id: newOutfit.bottom?.id || null,
          shoes_item_id: newOutfit.shoes?.id || null,
          dress_item_id: newOutfit.dress?.id || null,
          outerwear_item_id: newOutfit.outerwear?.id || null,
          accessory_item_id: newOutfit.accessory?.id || null,
        });
      }

      toast({
        title: "AI Suggested!",
        description: "New items suggested for unlocked slots",
      });
    } catch (error) {
      console.error("Error shuffling:", error);
      toast({
        title: "Error",
        description: "Failed to suggest items",
        variant: "destructive",
      });
    } finally {
      setShuffling(false);
    }
  };

  const checkIfInFavorites = async () => {
    const hasCoreItems = (outfit.dress || (outfit.top && outfit.bottom)) && outfit.shoes;
    if (!hasCoreItems) {
      setIsInFavorites(false);
      setCurrentFavoriteId(null);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favorites } = await supabase
        .from("favorite_outfits")
        .select("id")
        .eq("user_id", user.id)
        .eq("top_item_id", outfit.top?.id || null)
        .eq("bottom_item_id", outfit.bottom?.id || null)
        .eq("shoes_item_id", outfit.shoes?.id || null)
        .eq("dress_item_id", outfit.dress?.id || null)
        .eq("outerwear_item_id", outfit.outerwear?.id || null)
        .eq("accessory_item_id", outfit.accessory?.id || null)
        .maybeSingle();

      if (favorites) {
        setIsInFavorites(true);
        setCurrentFavoriteId(favorites.id);
      } else {
        setIsInFavorites(false);
        setCurrentFavoriteId(null);
      }
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const saveToFavorites = async () => {
    const hasCoreItems = (outfit.dress || (outfit.top && outfit.bottom)) && outfit.shoes;
    if (!hasCoreItems) {
      toast({
        title: "Cannot save",
        description: "Outfit must have core items to save",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isInFavorites && currentFavoriteId) {
        // Remove from favourites
        const { error } = await supabase
          .from("favorite_outfits")
          .delete()
          .eq("id", currentFavoriteId);

        if (error) throw error;

        setIsInFavorites(false);
        setCurrentFavoriteId(null);

        toast({
          title: "Removed",
          description: "Outfit removed from favourites",
        });
      } else {
        // Add to favourites
        // Track interaction
        await supabase.from("user_interactions").insert({
          user_id: user.id,
          interaction_type: "favorite",
          interaction_data: {
            outfit: {
              top_id: outfit.top?.id,
              bottom_id: outfit.bottom?.id,
              shoes_id: outfit.shoes?.id,
              dress_id: outfit.dress?.id,
              outerwear_id: outfit.outerwear?.id,
              accessory_id: outfit.accessory?.id,
            },
          },
        });

        const { data, error } = await supabase
          .from("favorite_outfits")
          .insert({
            user_id: user.id,
            top_item_id: outfit.top?.id || null,
            bottom_item_id: outfit.bottom?.id || null,
            shoes_item_id: outfit.shoes?.id || null,
            dress_item_id: outfit.dress?.id || null,
            outerwear_item_id: outfit.outerwear?.id || null,
            accessory_item_id: outfit.accessory?.id || null,
          })
          .select()
          .single();

        if (error) throw error;

        setIsInFavorites(true);
        setCurrentFavoriteId(data.id);

        toast({
          title: "Saved!",
          description: "Outfit added to favourites",
        });
      }
    } catch (error) {
      console.error("Error saving outfit:", error);
      toast({
        title: "Error",
        description: "Failed to update favourites",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }


      // Fetch all data in parallel
      Promise.all([
        // Get user profile
        supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.name) {
              const firstName = profile.name.split(" ")[0];
              setUserName(firstName);
            }
          }),
        // Get wardrobe items (cache for fast regeneration)
        supabase
          .from("wardrobe_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then(({ data: items }) => {
            if (items) setWardrobeItems(items);
          }),
        // Get weather (non-blocking)
        fetchWeather(),
      ]);

      // Generate outfit immediately with cached data
      setTimeout(() => generateOutfit(user.id), 100);
    };

    initializePage();
  }, []);

  // Check if outfit is in favourites whenever outfit changes
  useEffect(() => {
    checkIfInFavorites();
  }, [outfit]);

  // Regenerate outfit when weather loads (optional enhancement)
  useEffect(() => {
    if (weather !== null && wardrobeItems.length > 0 && !loading) {
      // Weather can influence outfit selection, but don't block initial generation
      console.log("Weather loaded, outfit may update based on conditions");
    }
  }, [weather]);

  if (loading && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Creating your look...</p>
        <p className="text-sm text-muted-foreground">This usually takes a few seconds</p>
      </div>
    );
  }

  if (error) {
    const isInsufficientItems = error.includes("No wardrobe items found");
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
        <div className="text-center max-w-md space-y-6">
          {isInsufficientItems ? (
            <>
              <div className="text-6xl mb-4">👗</div>
              <h2 className="text-3xl font-bold text-foreground">Generate your first outfit!</h2>
              <p className="text-lg text-muted-foreground">
                You need at least 10 wardrobe items to create outfits.
              </p>
              <p className="text-muted-foreground">
                Add items with a mix of tops, bottoms, and shoes to get started.
              </p>
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 space-y-3">
                <p className="text-sm font-medium text-foreground">You'll need:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Either tops + bottoms OR dresses</li>
                  <li>✓ Plus shoes</li>
                  <li>✓ At least 10 total items for best results</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Oops! Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
            </>
          )}
          
          <div className="flex gap-3 justify-center">
            {!isInsufficientItems && (
              <Button onClick={() => generateOutfit()}>
                Try Again
              </Button>
            )}
            <Button variant={isInsufficientItems ? "default" : "outline"} onClick={() => navigate("/")}>
              {isInsufficientItems ? "Add Items to Wardrobe" : "Back to Wardrobe"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate("/")} className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Kikonasu" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground hidden xs:block truncate">Kikonasu</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs sm:text-sm px-2 sm:px-4">
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")} className="text-xs sm:text-sm px-2 sm:px-4">
              Wardrobe
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/favorites")} className="text-xs sm:text-sm px-2 sm:px-4">
              Favourites
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-xs sm:text-sm px-2 sm:px-4">
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/suitcases")} className="text-xs sm:text-sm px-2 sm:px-4">
              📅 Plans
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/style-profile")} className="text-xs sm:text-sm px-2 sm:px-4">
              📊 Style
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }} className="text-xs sm:text-sm px-2 sm:px-4">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 lg:py-8 max-w-2xl lg:max-w-6xl">
        {/* Weather Display */}
        {weatherLoading && (
          <div className="text-center mb-6">
            <p className="text-muted-foreground">Loading weather...</p>
          </div>
        )}
        {weather && !weatherLoading && (
          <div className="text-center mb-6 p-4 bg-card rounded-xl border border-border">
            <p className="text-xl font-medium text-foreground">
              {weather.temperature}°C {getWeatherEmoji(weather.condition)} {weather.condition} in {weather.city}
            </p>
          </div>
        )}

        <div className="text-center mb-8">
          {userName && (
            <p className="text-lg text-muted-foreground mb-3">Hello, {userName}!</p>
          )}
          <h2 className="text-4xl font-bold text-foreground mb-2">
            Your Look for Today
          </h2>
          <p className="text-lg text-muted-foreground">Your current outfit selection</p>
        </div>

        {/* Smart Outerwear Suggestion */}
        {weather && (weather.temperature < 18 || weather.condition?.toLowerCase().includes('rain')) && (
          <div className="mb-6 p-4 bg-card rounded-xl border border-border">
            {hasOuterwearInWardrobe ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {weather.condition?.toLowerCase().includes('rain') 
                        ? `${weather.temperature}°C and rainy - jacket recommended!`
                        : `It's ${weather.temperature}°C - ${weather.temperature < 12 ? 'quite cold!' : 'a bit cool'}`
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {weather.temperature < 12 
                        ? 'We recommend wearing a jacket' 
                        : weather.condition?.toLowerCase().includes('rain')
                          ? 'Stay dry with outerwear'
                          : 'Consider adding a jacket'
                      }
                    </p>
                  </div>
                  {outfit.outerwear && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOuterwear(!showOuterwear)}
                    >
                      {showOuterwear ? 'Remove Jacket' : 'Add Jacket'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {weather.condition?.toLowerCase().includes('rain')
                    ? `It's rainy! Consider adding outerwear to your wardrobe to stay dry 🧥`
                    : `It's ${weather.temperature}°C outside. Consider adding outerwear to your wardrobe for cooler days! 🧥`
                  }
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                >
                  Add Outerwear
                </Button>
              </div>
            )}
          </div>
        )}


        {/* Outfit Display - 2x2 Grid on mobile, flexible on desktop */}
        <div className="mb-8 lg:max-w-4xl lg:mx-auto">
          {/* Base outfit items in grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4">
            {outfit.dress ? (
              <>
                <OutfitItem 
                  item={outfit.dress} 
                  label="Dress" 
                  isLocked={lockedCategories.has("Dress")}
                  onToggleLock={() => toggleLock("Dress")}
                  onRemove={() => removeItemFromOutfit("Dress")}
                  onClick={() => openSelectItemDialog("Dress")}
                />
                {outfit.shoes && (
                  <OutfitItem 
                    item={outfit.shoes} 
                    label="Shoes" 
                    isLocked={lockedCategories.has("Shoes")}
                    onToggleLock={() => toggleLock("Shoes")}
                    onRemove={() => removeItemFromOutfit("Shoes")}
                    onClick={() => openSelectItemDialog("Shoes")}
                  />
                )}
                {outfit.outerwear ? (
                  <OutfitItem 
                    item={outfit.outerwear} 
                    label="Outerwear" 
                    isLocked={lockedCategories.has("Outerwear")}
                    onToggleLock={() => toggleLock("Outerwear")}
                    onRemove={() => removeItemFromOutfit("Outerwear")}
                    onClick={() => openSelectItemDialog("Outerwear")}
                  />
                ) : (
                  <EmptySlot 
                    label="Outerwear" 
                    onAdd={() => openAddItemDialog("Outerwear")}
                  />
                )}
                {outfit.accessory ? (
                  <OutfitItem 
                    item={outfit.accessory} 
                    label="Accessory" 
                    isLocked={lockedCategories.has("Accessory")}
                    onToggleLock={() => toggleLock("Accessory")}
                    onRemove={() => removeItemFromOutfit("Accessory")}
                    onClick={() => openSelectItemDialog("Accessory")}
                  />
                ) : (
                  <EmptySlot 
                    label="Accessory" 
                    onAdd={() => openAddItemDialog("Accessory")}
                  />
                )}
              </>
            ) : (
              <>
                {outfit.top && (
                  <OutfitItem 
                    item={outfit.top} 
                    label="Top" 
                    isLocked={lockedCategories.has("Top")}
                    onToggleLock={() => toggleLock("Top")}
                    onRemove={() => removeItemFromOutfit("Top")}
                    onClick={() => openSelectItemDialog("Top")}
                  />
                )}
                {outfit.bottom && (
                  <OutfitItem 
                    item={outfit.bottom} 
                    label="Bottom" 
                    isLocked={lockedCategories.has("Bottom")}
                    onToggleLock={() => toggleLock("Bottom")}
                    onRemove={() => removeItemFromOutfit("Bottom")}
                    onClick={() => openSelectItemDialog("Bottom")}
                  />
                )}
                {outfit.shoes && (
                  <OutfitItem 
                    item={outfit.shoes} 
                    label="Shoes" 
                    isLocked={lockedCategories.has("Shoes")}
                    onToggleLock={() => toggleLock("Shoes")}
                    onRemove={() => removeItemFromOutfit("Shoes")}
                    onClick={() => openSelectItemDialog("Shoes")}
                  />
                )}
                {outfit.outerwear ? (
                  <OutfitItem 
                    item={outfit.outerwear} 
                    label="Outerwear" 
                    isLocked={lockedCategories.has("Outerwear")}
                    onToggleLock={() => toggleLock("Outerwear")}
                    onRemove={() => removeItemFromOutfit("Outerwear")}
                    onClick={() => openSelectItemDialog("Outerwear")}
                  />
                ) : (
                  <EmptySlot 
                    label="Outerwear" 
                    onAdd={() => openAddItemDialog("Outerwear")}
                  />
                )}
                {outfit.accessory ? (
                  <OutfitItem 
                    item={outfit.accessory} 
                    label="Accessory" 
                    isLocked={lockedCategories.has("Accessory")}
                    onToggleLock={() => toggleLock("Accessory")}
                    onRemove={() => removeItemFromOutfit("Accessory")}
                    onClick={() => openSelectItemDialog("Accessory")}
                  />
                ) : (
                  <EmptySlot 
                    label="Accessory" 
                    onAdd={() => openAddItemDialog("Accessory")}
                  />
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 lg:max-w-2xl lg:mx-auto">
            {/* Wish List Toggle */}
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
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
                    }
                  }}
                  className="w-5 h-5 rounded border-border"
                />
              </label>
            </div>

            <Button
              size="lg"
              onClick={openHorizontalBrowser}
              className="w-full min-h-[44px] touch-manipulation"
            >
              🔍 Browse & Select Items
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setLockedCategories(new Set());
                  toast({
                    title: "All items unlocked",
                    description: "All items are now available for AI suggestions"
                  });
                }}
                disabled={lockedCategories.size === 0}
                className="flex-1 min-h-[44px] touch-manipulation"
              >
                🔓 Unlock All
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={shuffleUnlockedItems}
                disabled={shuffling || lockedCategories.size >= (outfit.dress ? 2 : 3)}
                className="flex-1 min-h-[44px] touch-manipulation"
              >
                {shuffling ? "Suggesting..." : "✨ AI Assist"}
              </Button>
            </div>
            
            {lockedCategories.size > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Locked: {Array.from(lockedCategories).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 lg:max-w-2xl lg:mx-auto">
          <Button
            variant={isInFavorites ? "default" : "outline"}
            size="lg"
            onClick={saveToFavorites}
            disabled={saving || !((outfit.dress || (outfit.top && outfit.bottom)) && outfit.shoes)}
            className="w-full"
          >
            <Heart className="mr-2 h-5 w-5" fill={isInFavorites ? "currentColor" : "none"} />
            {isInFavorites ? "Saved to Favourites" : "Save to Favourites"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              // Track skip/regenerate interaction
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("user_interactions").insert({
                  user_id: user.id,
                  interaction_type: "regenerate",
                  interaction_data: {
                    previous_outfit: {
                      top_id: outfit.top?.id,
                      bottom_id: outfit.bottom?.id,
                      shoes_id: outfit.shoes?.id,
                      dress_id: outfit.dress?.id,
                    },
                  },
                });
              }
              generateOutfit();
            }}
            className="w-full"
          >
            ✨ Next Outfit
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Back to Wardrobe
          </Button>
        </div>
      </main>

      {/* Add Item Dialog */}
      {showAddItemDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">
                Choose {selectedCategory}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select an item from your wardrobe
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableItemsForCategory.map((item) => (
                  <WardrobeItemCard 
                    key={item.id} 
                    item={item} 
                    onSelect={addItemToOutfit} 
                  />
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowAddItemDialog(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Select Item Dialog */}
      <SelectWardrobeItemDialog
        open={showSelectItemDialog}
        onOpenChange={setShowSelectItemDialog}
        category={selectItemCategory}
        wardrobeItems={wardrobeItems}
        wishListItems={wishListItems}
        includeWishList={includeWishList}
        onSelect={handleSelectItemFromDialog}
        currentItemId={outfit[selectItemCategory.toLowerCase() as keyof Outfit]?.id}
      />

      {/* Horizontal Item Browser */}
      <HorizontalItemBrowser
        isOpen={showHorizontalBrowser}
        onClose={() => setShowHorizontalBrowser(false)}
        categories={[
          {
            category: "Top",
            items: wardrobeItems.filter(item => item.category === "Top"),
            currentItemId: outfit.top?.id || null,
            isLocked: lockedCategories.has("Top"),
          },
          {
            category: "Bottom",
            items: wardrobeItems.filter(item => item.category === "Bottom"),
            currentItemId: outfit.bottom?.id || null,
            isLocked: lockedCategories.has("Bottom"),
          },
          {
            category: "Dress",
            items: wardrobeItems.filter(item => item.category === "Dress"),
            currentItemId: outfit.dress?.id || null,
            isLocked: lockedCategories.has("Dress"),
          },
          {
            category: "Shoes",
            items: wardrobeItems.filter(item => item.category === "Shoes"),
            currentItemId: outfit.shoes?.id || null,
            isLocked: lockedCategories.has("Shoes"),
          },
          {
            category: "Outerwear",
            items: wardrobeItems.filter(item => item.category === "Outerwear"),
            currentItemId: outfit.outerwear?.id || null,
            isLocked: lockedCategories.has("Outerwear"),
          },
          {
            category: "Accessory",
            items: wardrobeItems.filter(item => item.category === "Accessory"),
            currentItemId: outfit.accessory?.id || null,
            isLocked: lockedCategories.has("Accessory"),
          },
        ].filter(cat => cat.items.length > 0)}
        onSelectItem={handleSelectItem}
        onToggleLock={toggleLock}
        onUnlockAll={() => {
          setLockedCategories(new Set());
          toast({
            title: "All items unlocked",
            description: "All items are now available for selection"
          });
        }}
      />
    </div>
  );
};

const WardrobeItemCard = ({ item, onSelect }: { item: WardrobeItem; onSelect: (item: WardrobeItem) => void }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div
      onClick={() => onSelect(item)}
      className="cursor-pointer group"
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-secondary/20 border-2 border-transparent hover:border-[hsl(var(--coral))] transition-all duration-300 group-hover:scale-105">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
            <span className="text-4xl mb-2">{getCategoryEmoji(item.category)}</span>
            <p className="text-xs text-muted-foreground">{item.category}</p>
          </div>
        ) : (
          <img
            src={item.signedUrl || item.image_url}
            alt={item.category}
            className="w-full h-full object-cover"
            onError={() => {
              console.error('Image failed to load in dialog:', item.image_url);
              setImgError(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

const EmptySlot = ({ label, onAdd }: { label: string; onAdd: () => void }) => (
  <div
    onClick={onAdd}
    className="bg-card/50 rounded-2xl p-3 lg:p-4 border-2 border-dashed border-border hover:border-[hsl(var(--coral))]/50 cursor-pointer transition-all duration-300 hover:scale-105 group"
  >
    <Badge 
      className="mb-2 text-xs font-medium capitalize opacity-50"
      style={{
        backgroundColor: 'rgba(245, 245, 243, 0.95)',
        color: '#2E2E2E',
        border: '1px solid #E0E0E0',
        borderRadius: '14px',
        padding: '4px 12px',
        fontSize: '12px'
      }}
    >
      {label}
    </Badge>
    <div className="aspect-square rounded-xl overflow-hidden bg-secondary/10 flex items-center justify-center lg:max-h-[300px]">
      <div className="text-center">
        <div className="text-4xl mb-2 opacity-30 group-hover:opacity-50 transition-opacity">+</div>
        <p className="text-xs text-muted-foreground">Tap to add</p>
      </div>
    </div>
  </div>
);

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

const OutfitItem = ({ 
  item, 
  label, 
  isLocked, 
  onToggleLock,
  onRemove,
  onClick,
}: { 
  item: WardrobeItem; 
  label: string;
  isLocked: boolean;
  onToggleLock: () => void;
  onRemove: () => void;
  onClick?: () => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const isOptional = label === "Outerwear" || label === "Accessory";
  
  return (
    <div 
      onClick={onClick}
      className={`
        bg-card rounded-2xl p-3 lg:p-4 shadow-[var(--shadow-soft)] 
        border-2 transition-all duration-300
        hover:shadow-[var(--shadow-medium)] relative group
        ${onClick ? 'cursor-pointer' : ''}
        ${isLocked 
          ? 'border-[hsl(var(--coral))] ring-2 ring-[hsl(var(--coral))]/20' 
          : 'border-border'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge 
          className="text-xs font-medium capitalize"
          style={{
            backgroundColor: 'rgba(245, 245, 243, 0.95)',
            color: '#2E2E2E',
            border: '1px solid #E0E0E0',
            borderRadius: '14px',
            padding: '4px 12px',
            fontSize: '12px'
          }}
        >
          {label}
        </Badge>
        <div className="flex items-center gap-2">
          {isOptional && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleLock();
            }}
            aria-label={isLocked ? "Unlock item" : "Lock item"}
            className={`
              min-w-[48px] min-h-[48px] p-3 -m-2 rounded-lg
              flex items-center justify-center
              transition-all duration-300 cursor-pointer touch-manipulation
              active:scale-90
              ${isLocked 
                ? 'text-[hsl(var(--coral))] bg-[hsl(var(--coral))]/10' 
                : 'text-muted-foreground hover:text-[hsl(var(--coral))] hover:bg-[hsl(var(--coral))]/5'
              }
            `}
          >
            {isLocked ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
          </button>
        </div>
      </div>
      <div className={`
        aspect-square rounded-xl overflow-hidden bg-secondary/20
        transition-all duration-300 relative
        lg:max-h-[300px]
        ${isLocked ? 'ring-2 ring-[hsl(var(--coral))]/30' : ''}
      `}>
        {item.isWishListItem && (
          <div className="absolute top-2 left-2 z-10 bg-[hsl(var(--coral))]/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>Wish List</span>
          </div>
        )}
        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
            <span className="text-5xl mb-2">{getCategoryEmoji(item.category)}</span>
            <p className="text-sm text-muted-foreground">{item.category}</p>
          </div>
        ) : (
          <img
            src={item.signedUrl || item.image_url}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', item.image_url, 'Signed URL:', item.signedUrl);
              setImageError(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TodaysLook;
