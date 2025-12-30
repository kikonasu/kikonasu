import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
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

interface FavoriteOutfit {
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

const Favorites = () => {
  const [favorites, setFavorites] = useState<FavoriteOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<FavoriteOutfit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: favData, error: favError } = await supabase
        .from("favorite_outfits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (favError) throw favError;

      if (!favData || favData.length === 0) {
        setFavorites([]);
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

      // Map favorites with their items
      const mappedFavorites = favData
        .map((fav) => {
          const top = itemsWithUrls?.find((item) => item.id === fav.top_item_id) || null;
          const bottom = itemsWithUrls?.find((item) => item.id === fav.bottom_item_id) || null;
          const shoes = itemsWithUrls?.find((item) => item.id === fav.shoes_item_id) || null;
          const dress = itemsWithUrls?.find((item) => item.id === fav.dress_item_id) || null;
          const outerwear = itemsWithUrls?.find((item) => item.id === fav.outerwear_item_id) || null;
          const accessory = itemsWithUrls?.find((item) => item.id === fav.accessory_item_id) || null;

          // Must have either (dress OR top+bottom) AND shoes
          const hasCoreItems = (dress || (top && bottom)) && shoes;
          if (!hasCoreItems) return null;

          return {
            id: fav.id,
            top,
            bottom,
            shoes,
            dress,
            outerwear,
            accessory,
            created_at: fav.created_at,
          };
        })
        .filter((fav): fav is FavoriteOutfit => fav !== null);

      setFavorites(mappedFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast({
        title: "Error",
        description: "Failed to load favourites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDelete = async () => {
    if (!outfitToDelete) return;

    try {
      const { error } = await supabase
        .from("favorite_outfits")
        .delete()
        .eq("id", outfitToDelete);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Outfit removed from favourites",
      });

      setFavorites((prev) => prev.filter((fav) => fav.id !== outfitToDelete));
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
      if (selectedOutfit?.id === outfitToDelete) {
        setSelectedOutfit(null);
      }
    } catch (error) {
      console.error("Error deleting favorite:", error);
      toast({
        title: "Error",
        description: "Failed to delete outfit",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading favourites...</p>
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
              Back to Favourites
            </Button>
          </div>
        </header>

        {/* Full Screen Outfit View */}
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">Saved Outfit</h2>
          </div>

          <div className="space-y-6 mb-8">
            {selectedOutfit.dress && <OutfitItemDisplay item={selectedOutfit.dress} label="Dress" />}
            {selectedOutfit.top && <OutfitItemDisplay item={selectedOutfit.top} label="Top" />}
            {selectedOutfit.bottom && <OutfitItemDisplay item={selectedOutfit.bottom} label="Bottom" />}
            {selectedOutfit.shoes && <OutfitItemDisplay item={selectedOutfit.shoes} label="Shoes" />}
            {selectedOutfit.outerwear && <OutfitItemDisplay item={selectedOutfit.outerwear} label="Outerwear" />}
            {selectedOutfit.accessory && <OutfitItemDisplay item={selectedOutfit.accessory} label="Accessory" />}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                setOutfitToDelete(selectedOutfit.id);
                setDeleteDialogOpen(true);
              }}
              className="w-full"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Delete Outfit
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSelectedOutfit(null)}
              className="w-full"
            >
              Back to Favourites
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-xs sm:text-sm px-2 sm:px-4">
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/suitcases")} className="text-xs sm:text-sm px-2 sm:px-4">
              📅 Plans
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wishlist")} className="text-xs sm:text-sm px-2 sm:px-4">
              🛍️ Wish List
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/style-profile")} className="text-xs sm:text-sm px-2 sm:px-4">
              📊 Style
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs sm:text-sm px-2 sm:px-4">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">Favourite Outfits</h2>
          <p className="text-lg text-muted-foreground">Your saved outfit combinations</p>
        </div>

        {favorites.length === 0 ? (
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
            {/* Header Section */}
            <div className="text-center mb-12 sm:mb-16 animate-fade-in">
              <div className="text-6xl sm:text-7xl mb-6">❤️</div>
              <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-4">
                Your Greatest Hits Collection
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Save your favorite outfits for quick access. Perfect for busy mornings when you need to look great fast.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/")}
                className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground shadow-[var(--shadow-soft)] text-base sm:text-lg px-6 sm:px-8 py-6"
              >
                ⭐ Generate Your First Outfit
              </Button>
            </div>

            {/* How It Works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Create</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Generate or build the perfect outfit</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-4xl mb-4">❤️</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Favorite</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Tap the heart to save it instantly</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Reuse</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Access your best looks anytime</p>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">🌅</div>
                <h4 className="font-semibold text-foreground mb-2">No More Morning Stress</h4>
                <p className="text-sm text-muted-foreground">Your best outfits, ready to go</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">💼</div>
                <h4 className="font-semibold text-foreground mb-2">Special Occasions</h4>
                <p className="text-sm text-muted-foreground">Save outfits for interviews, dates, presentations</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center shadow-[var(--shadow-soft)]">
                <div className="text-3xl mb-3">🔄</div>
                <h4 className="font-semibold text-foreground mb-2">Proven Winners</h4>
                <p className="text-sm text-muted-foreground">Wear what works, every time</p>
              </div>
            </div>

            {/* Bottom Text */}
            <p className="text-center text-sm text-muted-foreground">
              Favorites appear here automatically when you tap ❤️ on any outfit
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onView={() => setSelectedOutfit(favorite)}
                onDelete={() => {
                  setOutfitToDelete(favorite.id);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outfit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this outfit from your favourites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const FavoriteCard = ({
  favorite,
  onView,
  onDelete,
}: {
  favorite: FavoriteOutfit;
  onView: () => void;
  onDelete: () => void;
}) => {
  const itemsToShow = [
    favorite.dress,
    favorite.top,
    favorite.bottom,
    favorite.shoes,
    favorite.outerwear,
    favorite.accessory,
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
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {itemsToShow.length} items • {new Date(favorite.created_at).toLocaleDateString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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

export default Favorites;
