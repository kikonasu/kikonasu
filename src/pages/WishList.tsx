import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Trash2, ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";
import { AddWishListItemDialog } from "@/components/AddWishListItemDialog";
import { EditWishListItemDialog } from "@/components/EditWishListItemDialog";
import { OutfitPreviewModal } from "@/components/OutfitPreviewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WishListItem {
  id: string;
  image_url: string;
  category: string;
  ai_analysis: string | null;
  notes: string | null;
  outfit_potential: number;
  created_at: string;
  signedUrl?: string;
  affiliate_link?: string | null;
}

const WishList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortOrder, setSortOrder] = useState<string>("potential");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishListItem | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WishListItem | null>(null);

  useEffect(() => {
    fetchWishListItems();
    fetchWardrobeItems();
  }, [refreshTrigger]);

  const fetchWardrobeItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Generate signed URLs for wardrobe items
      const itemsWithUrls = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('wardrobe-images')
              .createSignedUrl(item.image_url, 3600);
            return { ...item, signedUrl: urlData?.signedUrl };
          } catch {
            return item;
          }
        })
      );

      setWardrobeItems(itemsWithUrls);
    } catch (error) {
      console.error("Error fetching wardrobe items:", error);
    }
  };

  const fetchWishListItems = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("wish_list_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Generate signed URLs
      const itemsWithUrls = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const { data: urlData, error: urlError } = await supabase.storage
              .from('wardrobe-images')
              .createSignedUrl(item.image_url, 3600);

            if (urlError) {
              console.error('Error generating signed URL:', urlError);
              return item;
            }

            return { ...item, signedUrl: urlData.signedUrl };
          } catch (error) {
            console.error('Error generating signed URL:', error);
            return item;
          }
        })
      );

      setItems(itemsWithUrls);
    } catch (error: any) {
      toast.error(error.message || "Failed to load wish list");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      const fileName = imageUrl.split("/").slice(-2).join("/");
      
      const { error: storageError } = await supabase.storage
        .from("wardrobe-images")
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("wish_list_items")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Item removed from wish list");
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const handleMoveToWardrobe = async (item: WishListItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Add to wardrobe
      const { error: insertError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          image_url: item.image_url,
          category: item.category,
          ai_analysis: item.ai_analysis,
        });

      if (insertError) throw insertError;

      // Remove from wish list
      const { error: deleteError } = await supabase
        .from("wish_list_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      toast.success(`✨ ${item.outfit_potential} new outfits unlocked! Item added to wardrobe.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to move item");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Calculate category counts
  const categoryCounts: Record<string, number> = {
    all: items.length,
  };
  
  items.forEach(item => {
    if (!categoryCounts[item.category]) {
      categoryCounts[item.category] = 0;
    }
    categoryCounts[item.category]++;
  });

  const getPluralDisplayName = (category: string): string => {
    if (category === "all") return "All Items";
    const pluralMap: Record<string, string> = {
      Top: "Tops",
      Bottom: "Bottoms",
      Shoes: "Shoes",
      Outerwear: "Outerwear",
      Dress: "Dresses",
      Accessory: "Accessories",
    };
    return pluralMap[category] || category;
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => activeFilter === "all" || item.category === activeFilter)
    .sort((a, b) => {
      switch (sortOrder) {
        case "potential":
          return b.outfit_potential - a.outfit_potential;
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "category-az":
          return a.category.localeCompare(b.category);
        case "category-za":
          return b.category.localeCompare(a.category);
        default:
          return 0;
      }
    });

  const categories = ["all", ...Array.from(new Set(items.map(item => item.category)))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading wish list...</p>
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
              Favorites
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-xs sm:text-sm px-2 sm:px-4">
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/suitcases")} className="text-xs sm:text-sm px-2 sm:px-4">
              📅 Plans
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-4">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="border-b border-border bg-card/30 sticky top-[73px] z-40">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              🛍️ Wish List {items.length > 0 && `(${items.length} items)`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Items you're considering purchasing</p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="shadow-[var(--shadow-soft)] text-sm flex-shrink-0"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="max-w-5xl mx-auto space-y-16 py-12 animate-fade-in">
            {/* Header Section */}
            <div className="text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Stop Buying Clothes<br />You'll Never Wear
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                See if it's worth it before you buy. Upload items you're considering and instantly discover your outfit potential.
              </p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                size="lg"
                className="text-lg px-8 py-6 shadow-[var(--shadow-soft)] hover:scale-105 transition-transform"
              >
                📸 Add Your First Item
              </Button>
            </div>

            {/* How It Works */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6 rounded-lg bg-card border border-border hover:shadow-md transition-shadow">
                <div className="text-5xl">📸</div>
                <h3 className="text-xl font-semibold text-foreground">Upload</h3>
                <p className="text-muted-foreground">
                  See something you like in-store or online? Take a photo.
                </p>
              </div>
              <div className="text-center space-y-4 p-6 rounded-lg bg-card border border-border hover:shadow-md transition-shadow">
                <div className="text-5xl">✨</div>
                <h3 className="text-xl font-semibold text-foreground">Analyze</h3>
                <p className="text-muted-foreground">
                  Our AI shows how many new outfits it creates with items you already own.
                </p>
              </div>
              <div className="text-center space-y-4 p-6 rounded-lg bg-card border border-border hover:shadow-md transition-shadow">
                <div className="text-5xl">🎯</div>
                <h3 className="text-xl font-semibold text-foreground">Decide</h3>
                <p className="text-muted-foreground">
                  Buy with confidence knowing it will actually get worn.
                </p>
              </div>
            </div>

            {/* Value Propositions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-card to-secondary/20 border border-border">
                <div className="text-4xl">💰</div>
                <h4 className="font-semibold text-foreground">Save Money</h4>
                <p className="text-sm text-muted-foreground">
                  Never waste money on clothes that don't work with your wardrobe
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-card to-secondary/20 border border-border">
                <div className="text-4xl">♻️</div>
                <h4 className="font-semibold text-foreground">Shop Smarter</h4>
                <p className="text-sm text-muted-foreground">
                  Buy only items that unlock multiple outfit combinations
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-card to-secondary/20 border border-border">
                <div className="text-4xl">⏰</div>
                <h4 className="font-semibold text-foreground">Save Time</h4>
                <p className="text-sm text-muted-foreground">
                  No more returns or buyer's remorse
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-lg bg-gradient-to-br from-card to-secondary/20 border border-border">
                <div className="text-4xl">✨</div>
                <h4 className="font-semibold text-foreground">Build Better</h4>
                <p className="text-sm text-muted-foreground">
                  Create a cohesive wardrobe where everything works together
                </p>
              </div>
            </div>

            {/* Example Preview */}
            <div className="bg-gradient-to-br from-[hsl(var(--coral))]/10 to-[hsl(var(--coral))]/5 rounded-2xl p-8 border-2 border-[hsl(var(--coral))]/20">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="inline-block bg-card rounded-lg p-6 shadow-lg">
                  <div className="w-48 h-48 mx-auto bg-secondary rounded-lg mb-4 flex items-center justify-center text-6xl">
                    👔
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[hsl(var(--coral))] font-bold text-xl mb-4">
                    <Sparkles className="h-6 w-6" />
                    <span>This creates 15 new outfits!</span>
                  </div>
                  <div className="text-left space-y-2">
                    <p className="text-sm font-semibold text-foreground">Pairs with:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Navy trousers</li>
                      <li>• White dress shirt</li>
                      <li>• Brown leather shoes</li>
                      <li className="text-[hsl(var(--coral))]">• And 12 more items...</li>
                    </ul>
                  </div>
                </div>
                <p className="text-lg text-foreground font-medium">
                  See exactly how each item works with your wardrobe before you buy
                </p>
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="text-center space-y-4 py-8">
              <Button
                onClick={() => setAddDialogOpen(true)}
                size="lg"
                className="text-lg px-8 py-6 shadow-[var(--shadow-soft)] hover:scale-105 transition-transform"
              >
                🛍️ Start Your Wish List
              </Button>
              <p className="text-muted-foreground">
                Try before you buy - virtually. See outfit potential before you purchase.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter and Sort Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(category => {
                  const count = categoryCounts[category] || 0;
                  if (category !== "all" && count === 0) return null;
                  
                  const isActive = activeFilter === category;
                  const displayName = getPluralDisplayName(category);
                  
                  return (
                    <Button
                      key={category}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(category)}
                      className={`whitespace-nowrap rounded-full ${
                        isActive ? "bg-[hsl(var(--coral))] hover:bg-[hsl(var(--coral))] text-white" : ""
                      }`}
                    >
                      {displayName} ({count})
                    </Button>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potential">Highest Potential</SelectItem>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="category-az">Category A-Z</SelectItem>
                    <SelectItem value="category-za">Category Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border"
                >
                  <div className="aspect-square relative bg-secondary">
                    <img
                      src={item.signedUrl || item.image_url}
                      alt={item.category}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium capitalize">
                      {item.category}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => {
                          setItemToEdit(item);
                          setEditDialogOpen(true);
                        }}
                      >
                        <span className="text-xs">✏️</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id, item.image_url)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Outfit Potential Badge - Clickable */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setPreviewModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-[hsl(var(--coral))] font-medium hover:underline cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm">{item.outfit_potential} new outfits</span>
                      </button>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleMoveToWardrobe(item)}
                        className="flex-1"
                        size="sm"
                      >
                        I Bought It!
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (item.affiliate_link) {
                            window.open(item.affiliate_link, '_blank', 'noopener,noreferrer');
                          } else {
                            toast.info("Affiliate link coming soon!");
                          }
                        }}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        Buy Now
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <AddWishListItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onItemAdded={() => setRefreshTrigger(prev => prev + 1)}
      />

      <EditWishListItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={itemToEdit}
        onItemUpdated={() => setRefreshTrigger(prev => prev + 1)}
      />

      {selectedItem && (
        <OutfitPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          wishListItem={selectedItem}
          wardrobeItems={wardrobeItems}
          outfitCount={selectedItem.outfit_potential}
        />
      )}
    </div>
  );
};

export default WishList;
