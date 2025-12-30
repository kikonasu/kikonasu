import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Sparkles } from "lucide-react";

interface WardrobeItemImageProps {
  imageUrl: string;
  displayUrl?: string; // Pre-generated signed URL
  category: string;
  description?: string; // For smart placeholder matching
  itemId?: string;
  onReupload?: (itemId: string) => void;
  className?: string;
  showReuploadButton?: boolean;
  isWishListItem?: boolean;
  useThumbnail?: boolean; // Use thumbnail version for grid views (faster loading)
}

// Helper to derive thumbnail path from original image path
const getThumbnailPath = (imagePath: string): string => {
  // Convert "user_id/1234567890.jpg" to "user_id/thumb_1234567890.webp"
  const parts = imagePath.split('/');
  if (parts.length < 2) return imagePath;

  const filename = parts[parts.length - 1];
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  const thumbFilename = `thumb_${nameWithoutExt}.webp`;

  return [...parts.slice(0, -1), thumbFilename].join('/');
};

const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    Top: "👕",
    Bottom: "👖",
    Shoes: "👟",
    Dress: "👗",
    Outerwear: "🧥",
    Accessory: "👜",
  };
  return emojiMap[category] || "👔";
};

export const getSmartPlaceholder = (category: string, description?: string): string => {
  const desc = description?.toLowerCase() || "";
  
  // Outerwear & Jackets
  if (desc.includes("hoodie") || desc.includes("hooded")) {
    if (desc.includes("beige") || desc.includes("tan") || desc.includes("khaki")) return "/templates/items/beige-hoodie.jpg";
    return "/templates/items/navy-hooded-jacket.jpg";
  }
  if (desc.includes("trench") || desc.includes("coat")) return "/templates/items/beige-trench-coat.jpg";
  if (desc.includes("bomber")) return "/templates/items/black-bomber-jacket.jpg";
  if (desc.includes("jacket")) return "/templates/items/navy-hooded-jacket.jpg";
  
  // Formal tops - blazers, dress shirts, oxfords
  if (desc.includes("blazer")) return "/templates/items/navy-blazer.jpg";
  if (desc.includes("oxford") || desc.includes("button-down") || desc.includes("button down")) {
    if (desc.includes("white")) return "/templates/items/white-button-down.jpg";
    if (desc.includes("navy") || desc.includes("blue")) return "/templates/items/navy-button-down.jpg";
    return "/templates/items/white-oxford.jpg";
  }
  if (desc.includes("dress shirt")) return "/templates/items/white-button-down.jpg";
  
  // Casual knits - sweaters, cardigans
  if (desc.includes("cardigan")) {
    if (desc.includes("navy") || desc.includes("blue") || desc.includes("dark")) return "/templates/items/navy-cardigan.jpg";
    return "/templates/items/grey-crewneck.jpg";
  }
  if (desc.includes("sweater") || desc.includes("sweatshirt")) {
    if (desc.includes("grey") || desc.includes("gray")) return "/templates/items/grey-sweatshirt.jpg";
    return "/templates/items/grey-crewneck.jpg";
  }
  if (desc.includes("knit") || desc.includes("knitted")) return "/templates/items/grey-knitted-polo.jpg";
  
  // Polo shirts
  if (desc.includes("polo")) return "/templates/items/black-knitted-polo.jpg";
  
  // Casual tops - tees, henleys
  if (desc.includes("henley")) {
    if (desc.includes("grey") || desc.includes("gray")) return "/templates/items/grey-henley.jpg";
    return "/templates/items/black-tee.jpg";
  }
  if (desc.includes("t-shirt") || desc.includes("tee")) {
    if (desc.includes("white")) return "/templates/items/white-tee.jpg";
    if (desc.includes("grey") || desc.includes("gray")) return "/templates/items/grey-tee.jpg";
    if (desc.includes("navy")) return "/templates/items/navy-tee.jpg";
    return "/templates/items/black-tee.jpg";
  }
  if (desc.includes("crew neck") || desc.includes("crewneck")) return "/templates/items/grey-crewneck.jpg";
  if (desc.includes("rollneck") || desc.includes("turtleneck")) return "/templates/items/black-rollneck.jpg";
  
  // Shoes
  if (desc.includes("running") || desc.includes("athletic") || desc.includes("sport")) {
    if (desc.includes("grey") || desc.includes("gray")) return "/templates/items/grey-running-shoes.jpg";
    return "/templates/items/grey-sneakers.jpg";
  }
  if (desc.includes("sneaker")) {
    if (desc.includes("white")) return "/templates/items/white-sneakers.jpg";
    if (desc.includes("grey") || desc.includes("gray")) return "/templates/items/grey-running-shoes.jpg";
    return "/templates/items/grey-sneakers.jpg";
  }
  if (desc.includes("boot") || desc.includes("chelsea")) return "/templates/items/black-chelsea-boots.jpg";
  if (desc.includes("loafer")) {
    if (desc.includes("brown")) return "/templates/items/brown-loafers.jpg";
    return "/templates/items/black-loafers.jpg";
  }
  
  // Pants - more specific matching
  if (desc.includes("sweatpant") || desc.includes("jogger")) return "/templates/items/grey-sweatpants.jpg";
  if (desc.includes("dress pant") || desc.includes("trouser") || desc.includes("tailored")) {
    if (desc.includes("black")) return "/templates/items/black-tailored-trousers.jpg";
    return "/templates/items/navy-dress-pants.jpg";
  }
  if (desc.includes("chino")) {
    if (desc.includes("beige") || desc.includes("khaki") || desc.includes("tan")) return "/templates/items/beige-chinos.jpg";
    return "/templates/items/navy-dress-pants.jpg";
  }
  if (desc.includes("jean") || desc.includes("denim")) {
    if (desc.includes("black")) return "/templates/items/black-jeans.jpg";
    return "/templates/items/dark-jeans.jpg";
  }
  
  // Category fallbacks
  const fallbackMap: Record<string, string> = {
    Top: "/templates/items/navy-blazer.jpg",
    Bottom: "/templates/items/navy-dress-pants.jpg",
    Shoes: "/templates/items/white-sneakers.jpg",
    Dress: "/templates/items/navy-blazer.jpg",
    Outerwear: "/templates/items/navy-hooded-jacket.jpg",
    Accessory: "/templates/items/brown-loafers.jpg",
  };
  return fallbackMap[category] || "/templates/items/navy-blazer.jpg";
};

export const WardrobeItemImage = ({
  imageUrl,
  displayUrl: preGeneratedUrl,
  category,
  description,
  itemId,
  onReupload,
  className = "",
  showReuploadButton = false,
  isWishListItem = false,
  useThumbnail = false,
}: WardrobeItemImageProps) => {
  const [displayUrl, setDisplayUrl] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    // If displayUrl is provided, use it directly (skip generation)
    if (preGeneratedUrl) {
      setDisplayUrl(preGeneratedUrl);
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      setImageError(false);
      setImageLoaded(false);
      setUsingFallback(false);

      try {
        // Check if it's already a full URL
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          setDisplayUrl(imageUrl);
          setLoading(false);
          return;
        }

        // Determine which path to use (thumbnail or original)
        const pathToLoad = useThumbnail ? getThumbnailPath(imageUrl) : imageUrl;

        // Try to get the image URL (use public URL for better caching)
        const { data } = supabase.storage
          .from('wardrobe-images')
          .getPublicUrl(pathToLoad);

        if (data?.publicUrl) {
          setDisplayUrl(data.publicUrl);
        } else {
          throw new Error('No public URL returned');
        }
      } catch (error) {
        // If thumbnail fails, fall back to original
        if (useThumbnail && !usingFallback) {
          setUsingFallback(true);
          const { data } = supabase.storage
            .from('wardrobe-images')
            .getPublicUrl(imageUrl);
          if (data?.publicUrl) {
            setDisplayUrl(data.publicUrl);
          } else {
            setImageError(true);
            setDisplayUrl('');
          }
        } else {
          setImageError(true);
          setDisplayUrl('');
        }
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [preGeneratedUrl, imageUrl, itemId, category, useThumbnail]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Try one automatic retry
    if (retryCount < 1) {
      setRetryCount(retryCount + 1);
      setImageError(false);
      
      // Force reload with new instance
      const img = new Image();
      img.src = displayUrl || imageUrl;
      img.onload = () => {
        setImageLoaded(true);
        setImageError(false);
      };
      img.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
        e.currentTarget.style.display = 'none';
      };
    } else {
      setImageError(true);
      setImageLoaded(false);
      e.currentTarget.style.display = 'none';
    }
  };

  // Loading state - show skeleton
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl opacity-30">{getCategoryEmoji(category)}</div>
        </div>
      </div>
    );
  }

  // Error state or no image - show placeholder
  if (imageError || !displayUrl) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={getSmartPlaceholder(category, description)}
          alt={category}
          loading="lazy"
          decoding="async"
          className={`${className} object-cover opacity-60 border border-border/50`}
        />
        {showReuploadButton && itemId && onReupload && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReupload(itemId)}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Upload Image
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Success state - show image with smooth transition
  return (
    <div className={`relative ${className}`}>
      {isWishListItem && (
        <div className="absolute top-2 left-2 z-10 bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Wish List</span>
        </div>
      )}
      {!imageLoaded && (
        <>
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl opacity-30">{getCategoryEmoji(category)}</div>
          </div>
        </>
      )}
      <img
        src={displayUrl}
        alt={category}
        loading="lazy"
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 border border-border/50`}
      />
    </div>
  );
};
