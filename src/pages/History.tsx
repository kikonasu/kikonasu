import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";
import { getSignedUrl } from "@/lib/storageUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  signedUrl?: string;
}

interface HistoryOutfit {
  id: string;
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  dress: WardrobeItem | null;
  outerwear: WardrobeItem | null;
  accessory: WardrobeItem | null;
  created_at: string;
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

const ItemImage = ({ item, alt, className }: { item: WardrobeItem; alt: string; className?: string }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-muted ${className || ''}`}>
        <span className="text-3xl">{getCategoryEmoji(item.category)}</span>
      </div>
    );
  }
  
  return (
    <img
      src={item.signedUrl || item.image_url}
      alt={alt}
      className={className || "w-full h-full object-cover"}
      onError={() => {
        console.error('Image failed to load:', item.image_url);
        setImageError(true);
      }}
    />
  );
};

const History = () => {
  const [history, setHistory] = useState<HistoryOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<HistoryOutfit | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(null);
  const [savingToFavorites, setSavingToFavorites] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: historyData, error: historyError } = await supabase
        .from("outfit_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch only the current user's wardrobe items
      const { data: items, error: itemsError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) throw itemsError;

      // Generate signed URLs for all items
      const itemsWithUrls = await Promise.all(
        (items || []).map(async (item) => {
          const signedUrl = await getSignedUrl(item.image_url);
          return { ...item, signedUrl };
        })
      );

      // Map history with their items
      const mappedHistory = historyData
        .map((hist) => {
          const top = itemsWithUrls?.find((item) => item.id === hist.top_item_id) || null;
          const bottom = itemsWithUrls?.find((item) => item.id === hist.bottom_item_id) || null;
          const shoes = itemsWithUrls?.find((item) => item.id === hist.shoes_item_id) || null;
          const dress = itemsWithUrls?.find((item) => item.id === hist.dress_item_id) || null;
          const outerwear = itemsWithUrls?.find((item) => item.id === hist.outerwear_item_id) || null;
          const accessory = itemsWithUrls?.find((item) => item.id === hist.accessory_item_id) || null;

          // Must have either (dress OR top+bottom) AND shoes
          const hasCoreItems = (dress || (top && bottom)) && shoes;
          if (!hasCoreItems) return null;

          return {
            id: hist.id,
            top,
            bottom,
            shoes,
            dress,
            outerwear,
            accessory,
            created_at: hist.created_at,
          };
        })
        .filter((hist): hist is HistoryOutfit => hist !== null);

      setHistory(mappedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const checkIfInFavorites = async (outfit: HistoryOutfit) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
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

      if (error) throw error;
      
      if (data) {
        setIsInFavorites(true);
        setCurrentFavoriteId(data.id);
      } else {
        setIsInFavorites(false);
        setCurrentFavoriteId(null);
      }
    } catch (error) {
      console.error("Error checking favourites:", error);
    }
  };

  const handleSaveToFavorites = async () => {
    if (!selectedOutfit) return;
    
    setSavingToFavorites(true);
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
        const { data, error } = await supabase
          .from("favorite_outfits")
          .insert({
            user_id: user.id,
            top_item_id: selectedOutfit.top?.id || null,
            bottom_item_id: selectedOutfit.bottom?.id || null,
            shoes_item_id: selectedOutfit.shoes?.id || null,
            dress_item_id: selectedOutfit.dress?.id || null,
            outerwear_item_id: selectedOutfit.outerwear?.id || null,
            accessory_item_id: selectedOutfit.accessory?.id || null,
          })
          .select()
          .single();

        if (error) throw error;

        setIsInFavorites(true);
        setCurrentFavoriteId(data.id);

        toast({
          title: "Saved!",
          description: "Outfit saved to favourites",
        });
      }
    } catch (error) {
      console.error("Error updating favourites:", error);
      toast({
        title: "Error",
        description: "Failed to update favourites",
        variant: "destructive",
      });
    } finally {
      setSavingToFavorites(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("outfit_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Cleared",
        description: "All history has been removed",
      });

      setHistory([]);
      setClearDialogOpen(false);
      setSelectedOutfit(null);
    } catch (error) {
      console.error("Error clearing history:", error);
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedOutfit) {
      checkIfInFavorites(selectedOutfit);
    }
  }, [selectedOutfit]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  if (selectedOutfit) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Kikonasu" className="h-10 w-10 object-contain" />
              <h1 className="text-2xl font-bold text-foreground">Kikonasu</h1>
            </div>
            <Button variant="ghost" onClick={() => setSelectedOutfit(null)}>
              Back to History
            </Button>
          </div>
        </header>

        {/* Full Screen Outfit View */}
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">Outfit from History</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(selectedOutfit.created_at).toLocaleString()}
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {selectedOutfit.dress && <OutfitItemDisplay item={selectedOutfit.dress} label="Dress" />}
            {selectedOutfit.top && <OutfitItemDisplay item={selectedOutfit.top} label="Top" />}
            {selectedOutfit.bottom && <OutfitItemDisplay item={selectedOutfit.bottom} label="Bottom" />}
            {selectedOutfit.shoes && <OutfitItemDisplay item={selectedOutfit.shoes} label="Shoes" />}
            {selectedOutfit.outerwear && <OutfitItemDisplay item={selectedOutfit.outerwear} label="Outerwear" />}
            {selectedOutfit.accessory && <OutfitItemDisplay item={selectedOutfit.accessory} label="Accessory" />}
          </div>

          <div className="space-y-3">
            <Button
              variant={isInFavorites ? "default" : "outline"}
              size="lg"
              onClick={handleSaveToFavorites}
              disabled={savingToFavorites}
              className="w-full"
            >
              <Heart className="mr-2 h-5 w-5" fill={isInFavorites ? "currentColor" : "none"} />
              {isInFavorites ? "Saved to Favourites" : "Save to Favourites"}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setSelectedOutfit(null)}
              className="w-full"
            >
              Back to History
            </Button>
          </div>
        </main>
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/suitcases")} className="text-xs sm:text-sm px-2 sm:px-4">
              📅 Plans
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wishlist")} className="text-xs sm:text-sm px-2 sm:px-4">
              🛍️ Wish List
            </Button>
            {history.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Clear
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs sm:text-sm px-2 sm:px-4">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-foreground mb-2">Outfit History</h2>
          <p className="text-lg text-muted-foreground">
            Your last {history.length} generated outfit{history.length !== 1 ? 's' : ''}
          </p>
        </div>

        {history.length === 0 ? (
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
            {/* Header Section */}
            <div className="text-center mb-12 sm:mb-16 animate-fade-in">
              <div className="text-6xl sm:text-7xl mb-6">📜</div>
              <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
                Never Forget What Worked
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Your outfit history helps you track what you've worn and rediscover great combinations you loved.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/")}
                className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground shadow-[var(--shadow-soft)] text-base sm:text-lg px-6 sm:px-8 py-6"
              >
                🎨 Create Your First Outfit
              </Button>
            </div>

            {/* How It Works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-4xl mb-4">💾</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Automatic</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Every outfit you generate gets saved</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Track</h3>
                <p className="text-sm sm:text-base text-muted-foreground">See when you wore what</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Rewear</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Find and recreate past favourites</p>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="font-semibold text-foreground mb-2">No Outfit Repeats</h4>
                <p className="text-sm text-muted-foreground">Know exactly what you wore to that meeting last month</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">💡</div>
                <h4 className="font-semibold text-foreground mb-2">Rediscover Gems</h4>
                <p className="text-sm text-muted-foreground">Find combinations you forgot about</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="font-semibold text-foreground mb-2">Understand Your Style</h4>
                <p className="text-sm text-muted-foreground">See patterns in what you actually wear</p>
              </div>
            </div>

            {/* Example Preview */}
            <div className="bg-muted/30 border border-border rounded-xl p-6 sm:p-8 mb-8">
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm sm:text-base">Yesterday - Navy blazer, white shirt...</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm sm:text-base">3 days ago - Casual Friday look...</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm sm:text-base">Last week - Date night outfit...</span>
                </div>
              </div>
            </div>

            {/* Bottom Text */}
            <p className="text-center text-sm text-muted-foreground">
              Your history starts building automatically as you use Kikonasu
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((outfit) => (
              <HistoryCard
                key={outfit.id}
                outfit={outfit}
                onView={() => setSelectedOutfit(outfit)}
              />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all outfit history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const HistoryCard = ({
  outfit,
  onView,
}: {
  outfit: HistoryOutfit;
  onView: () => void;
}) => {
  const itemsToShow = [
    outfit.dress,
    outfit.top,
    outfit.bottom,
    outfit.shoes,
    outfit.outerwear,
    outfit.accessory,
  ].filter(Boolean) as WardrobeItem[];

  return (
    <div 
      className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)] cursor-pointer"
      onClick={onView}
    >
      <div className="grid grid-cols-3 gap-2 mb-3">
        {itemsToShow.slice(0, 3).map((item, idx) => (
          <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-secondary/20">
            <ItemImage item={item} alt={item.category} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          {itemsToShow.length} items • {new Date(outfit.created_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

const OutfitItemDisplay = ({ item, label }: { item: WardrobeItem; label: string }) => (
  <div className="bg-card rounded-2xl p-6 shadow-[var(--shadow-soft)] border border-border">
    <Badge className="mb-3">{label}</Badge>
    <div className="aspect-square rounded-xl overflow-hidden bg-secondary/20">
      <ItemImage item={item} alt={label} className="w-full h-full object-cover" />
    </div>
  </div>
);

export default History;
