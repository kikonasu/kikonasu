import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WardrobeItemImage } from "@/components/WardrobeItemImage";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  created_at: string;
  displayUrl?: string; // Pre-generated signed URL
}

interface WardrobeGridProps {
  onAddClick: () => void;
  onItemsChange?: (items: WardrobeItem[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  refreshTrigger?: number;
  onEditClick?: (item: WardrobeItem) => void;
}

export const WardrobeGrid = ({ onAddClick, onItemsChange, onLoadingChange, refreshTrigger, onEditClick }: WardrobeGridProps) => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("recent");

  // Fast path extraction - no complex regex
  const extractStoragePath = (imageUrl: string): string => {
    // Already a path? Return immediately
    if (!imageUrl.includes('://')) {
      return imageUrl;
    }
    
    // Extract everything after 'wardrobe-images/'
    const match = imageUrl.split('wardrobe-images/')[1];
    if (match) {
      return match.split('?')[0]; // Remove query parameters
    }
    
    return imageUrl;
  };

  // Cache signed URLs in localStorage
  const CACHE_KEY = 'wardrobe_signed_urls';
  const CACHE_DURATION = 3000000; // 50 minutes (under 1 hour expiry)
  
  const getCachedUrl = (itemId: string): string | null => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const cached = cache[itemId];
      if (cached && Date.now() < cached.expiry) {
        return cached.url;
      }
    } catch {
      // Cache read error, return null to regenerate URL
    }
    return null;
  };
  
  const setCachedUrl = (itemId: string, url: string) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[itemId] = {
        url,
        expiry: Date.now() + CACHE_DURATION
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Cache write error, ignore silently
    }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Generate signed URLs with caching for maximum performance
      const itemsWithUrls = await Promise.all(
        (data || []).map(async (item) => {
          // Check cache first
          const cachedUrl = getCachedUrl(item.id);
          if (cachedUrl) {
            return { ...item, displayUrl: cachedUrl };
          }

          const storagePath = extractStoragePath(item.image_url);

          // If it's a full external URL, use as-is
          if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
            return { ...item, displayUrl: storagePath };
          }

          // Generate fresh signed URL (24 hour expiry)
          const { data: urlData } = await supabase.storage
            .from('wardrobe-images')
            .createSignedUrl(storagePath, 86400);

          const displayUrl = urlData?.signedUrl || null;

          // Cache the URL
          if (displayUrl) {
            setCachedUrl(item.id, displayUrl);
          }

          return { ...item, displayUrl };
        })
      );

      setItems(itemsWithUrls);
      onItemsChange?.(itemsWithUrls);
      setLoading(false);
      onLoadingChange?.(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load wardrobe";
      toast.error(message);
      setLoading(false);
      onLoadingChange?.(false);
    }
  }, [onItemsChange, onLoadingChange]);

  useEffect(() => {
    fetchItems();
  }, [refreshTrigger, fetchItems]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
      Top: 0,
      Bottom: 0,
      Shoes: 0,
      Outerwear: 0,
      Dress: 0,
      Accessory: 0,
    };
    
    items.forEach(item => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    
    return counts;
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    // First, apply filter
    const filtered = activeFilter === "all" 
      ? items 
      : items.filter(item => item.category === activeFilter);
    
    // Then, apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "category-az":
          return a.category.localeCompare(b.category);
        case "category-za":
          return b.category.localeCompare(a.category);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [items, activeFilter, sortOrder]);

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      const fileName = imageUrl.split("/").slice(-2).join("/");
      
      const { error: storageError } = await supabase.storage
        .from("wardrobe-images")
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("wardrobe_items")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast.success("Item removed");
      fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete item";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading wardrobe...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-xl text-muted-foreground">Your wardrobe is empty</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Add clothing items to start creating outfits. You need either (Top + Bottom + Shoes) or (Dress + Shoes) to get started.
        </p>
        <Button onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Item
        </Button>
      </div>
    );
  }

  // Helper function for pluralization
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

  // Keep "all" first, then sort remaining categories alphabetically
  const categories = ["all", ...["Top", "Bottom", "Shoes", "Outerwear", "Dress", "Accessory"].sort()];
  
  // Empty state for filtered view
  if (filteredAndSortedItems.length === 0 && activeFilter !== "all") {
    const categoryName = activeFilter.toLowerCase();
    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => {
              const count = categoryCounts[category] || 0;
              // Only show "all" or categories with items
              if (category !== "all" && count === 0) return null;
              
              const isActive = activeFilter === category;
              const displayName = getPluralDisplayName(category);
              
              return (
                <Button
                  key={category}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(category)}
                  className="whitespace-nowrap rounded-full"
                >
                  {displayName}
                </Button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="category-az">Category A-Z</SelectItem>
                <SelectItem value="category-za">Category Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-xl text-muted-foreground">No {categoryName} items yet</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Add your first {categoryName} item to get started
          </p>
          <Button onClick={onAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add {activeFilter} Item
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(category => {
            const count = categoryCounts[category] || 0;
            // Only show "all" or categories with items
            if (category !== "all" && count === 0) return null;
            
            const isActive = activeFilter === category;
            const displayName = getPluralDisplayName(category);
            
            return (
              <Button
                key={category}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(category)}
                className="whitespace-nowrap rounded-full"
                >
                {displayName}
              </Button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="category-az">Category A-Z</SelectItem>
              <SelectItem value="category-za">Category Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Item Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredAndSortedItems.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <WardrobeItemImage
              imageUrl={item.image_url}
              displayUrl={item.displayUrl}
              category={item.category}
              itemId={item.id}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium capitalize">
              {item.category}
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEditClick?.(item)}
              >
                <Pencil className="h-3 w-3" />
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
        ))}
      </div>
    </div>
  );
};
