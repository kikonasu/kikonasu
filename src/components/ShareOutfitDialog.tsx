import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Link2, Instagram, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";

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

interface ShareOutfitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outfit: Outfit;
}

export const ShareOutfitDialog = ({ open, onOpenChange, outfit }: ShareOutfitDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Polyfill for roundRect if not supported
  useEffect(() => {
    if (typeof CanvasRenderingContext2D.prototype.roundRect === 'undefined') {
      CanvasRenderingContext2D.prototype.roundRect = function(x: number, y: number, width: number, height: number, radius: number) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }
  }, []);

  useEffect(() => {
    if (open) {
      generateOutfitImage();
    }
  }, [open, outfit]);

  const loadImage = async (src: string): Promise<HTMLImageElement> => {
    try {
      console.log('🖼️ Loading image from:', src.substring(0, 80) + '...');
      
      // If it's already a data URL, use it directly
      if (src.startsWith('data:')) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            console.log('✓ Data URL image loaded successfully');
            resolve(img);
          };
          img.onerror = reject;
          img.src = src;
        });
      }

      // Fetch image as blob to avoid CORS taint issues
      console.log('📥 Fetching image as blob to avoid CORS issues...');
      const response = await fetch(src);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('✓ Blob fetched, size:', blob.size, 'bytes');
      
      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log('✓ Converted to data URL');
      
      // Load the data URL into an image
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('✓ Image loaded successfully, dimensions:', img.width, 'x', img.height);
          resolve(img);
        };
        img.onerror = (error) => {
          console.error('❌ Failed to load image element:', error);
          reject(error);
        };
        img.src = dataUrl;
      });
    } catch (error) {
      console.error('❌ Error in loadImage:', error);
      throw error;
    }
  };

  const generateOutfitImage = async () => {
    setGenerating(true);
    try {
      console.log('🎨 === STARTING OUTFIT IMAGE GENERATION ===');
      console.log('🎯 FULL OUTFIT OBJECT:', JSON.stringify(outfit, null, 2));
      console.log('📦 Top item:', outfit.top);
      console.log('📦 Bottom item:', outfit.bottom);
      console.log('📦 Shoes item:', outfit.shoes);
      console.log('🖼️ Top image URL:', outfit.top?.image_url);
      console.log('🖼️ Top signed URL:', outfit.top?.signedUrl);
      console.log('🖼️ Bottom image URL:', outfit.bottom?.image_url);
      console.log('🖼️ Bottom signed URL:', outfit.bottom?.signedUrl);
      console.log('🖼️ Shoes image URL:', outfit.shoes?.image_url);
      console.log('🖼️ Shoes signed URL:', outfit.shoes?.signedUrl);

      // Check existence and validity
      if (outfit.top?.image_url || outfit.top?.signedUrl) {
        console.log('✅ Top has image URL, will attempt to load');
      } else {
        console.error('❌ Top is missing or has no image_url/signedUrl!');
      }
      
      if (outfit.bottom?.image_url || outfit.bottom?.signedUrl) {
        console.log('✅ Bottom has image URL, will attempt to load');
      } else {
        console.error('❌ Bottom is missing or has no image_url/signedUrl!');
      }
      
      if (outfit.shoes?.image_url || outfit.shoes?.signedUrl) {
        console.log('✅ Shoes has image URL, will attempt to load');
      } else {
        console.error('❌ Shoes is missing or has no image_url/signedUrl!');
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Canvas dimensions
      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#FAF9F6");
      gradient.addColorStop(1, "#F5F5F0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Get outfit items
      const items: Array<{ item: WardrobeItem; label: string }> = [];
      if (outfit.dress) items.push({ item: outfit.dress, label: "Dress" });
      if (outfit.top) items.push({ item: outfit.top, label: "Top" });
      if (outfit.bottom) items.push({ item: outfit.bottom, label: "Bottom" });
      if (outfit.outerwear) items.push({ item: outfit.outerwear, label: "Outerwear" });
      if (outfit.shoes) items.push({ item: outfit.shoes, label: "Shoes" });
      if (outfit.accessory) items.push({ item: outfit.accessory, label: "Accessory" });
      
      console.log(`📦 Processing ${items.length} items:`, items.map(i => i.label).join(', '));

      // Calculate grid layout
      const cols = items.length <= 3 ? items.length : 3;
      const rows = Math.ceil(items.length / cols);
      const itemSize = 280;
      const padding = 40;
      const totalWidth = cols * itemSize + (cols - 1) * padding;
      const totalHeight = rows * itemSize + (rows - 1) * padding;
      const startX = (width - totalWidth) / 2;
      const startY = 120;

      // Draw title
      ctx.fillStyle = "#2C2C2C";
      ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("My Outfit", width / 2, 70);

      // Helper function for category emojis
      const getCategoryEmoji = (category: string): string => {
        const categoryLower = category.toLowerCase();
        if (categoryLower.includes('dress')) return '👗';
        if (categoryLower.includes('top')) return '👕';
        if (categoryLower.includes('bottom')) return '👖';
        if (categoryLower.includes('shoe')) return '👟';
        if (categoryLower.includes('outerwear')) return '🧥';
        if (categoryLower.includes('accessory')) return '👜';
        return '👔';
      };

      // Draw outfit items
      for (let i = 0; i < items.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (itemSize + padding);
        const y = startY + row * (itemSize + padding);

        const { item, label } = items[i];
        
        // Draw white card background with shadow first
        ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = "#FFFFFF";
        ctx.roundRect(x, y, itemSize, itemSize, 16);
        ctx.fill();
        ctx.shadowColor = "transparent";

        // Try to load and draw image
        const imageUrl = item.signedUrl || item.image_url;
        console.log(`🔗 ${label} - Using URL (signedUrl: ${!!item.signedUrl}, image_url: ${!!item.image_url}):`, imageUrl);
        console.log(`🔗 ${label} - Full URL:`, imageUrl);
        console.log(`🔗 ${label} - Item object:`, JSON.stringify(item, null, 2));

        if (!imageUrl) {
          console.error(`❌ ${label} - NO IMAGE URL AVAILABLE!`);
          throw new Error(`No image URL for ${label}`);
        }

        try {
          console.log(`⏳ ${label} - Starting loadImage...`);
          const img = await loadImage(imageUrl);
          console.log(`✅ ${label} - Successfully loaded image, dimensions: ${img.width}x${img.height}`);

          // Draw image
          const imgPadding = 16;
          const imgSize = itemSize - imgPadding * 2;
          
          console.log(`🎨 ${label} - Card position: x=${x}, y=${y}, size=${itemSize}`);
          console.log(`🎨 ${label} - Image will be drawn in area: x=${x + imgPadding}, y=${y + imgPadding}, size=${imgSize}`);
          
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x + imgPadding, y + imgPadding, imgSize, imgSize, 12);
          ctx.clip();
          
          // Calculate scaling to cover the area
          const scale = Math.max(imgSize / img.width, imgSize / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const imgX = x + imgPadding + (imgSize - scaledWidth) / 2;
          const imgY = y + imgPadding + (imgSize - scaledHeight) / 2;
          
          console.log(`🎨 ${label} - Drawing image: imgX=${imgX}, imgY=${imgY}, scaledWidth=${scaledWidth}, scaledHeight=${scaledHeight}`);
          console.log(`🎨 ${label} - About to call ctx.drawImage()...`);
          
          ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
          
          console.log(`✅ ${label} - ctx.drawImage() completed successfully`);
          ctx.restore();
          console.log(`✅ ${label} - Canvas state restored`);

          // Draw wish list badge if applicable
          if (item.isWishListItem) {
            ctx.fillStyle = "#FF6B9D";
            ctx.beginPath();
            ctx.roundRect(x + itemSize - 90, y + 12, 78, 28, 14);
            ctx.fill();
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("✨ Wish List", x + itemSize - 51, y + 31);
          }
        } catch (error) {
          console.error(`❌ ${label} - FAILED TO LOAD IMAGE`);
          console.error(`❌ ${label} - Error details:`, error);
          console.error(`❌ ${label} - URL that failed:`, imageUrl);
          
          // Draw placeholder for failed image
          const imgPadding = 16;
          const imgSize = itemSize - imgPadding * 2;
          
          // Draw gray placeholder background
          ctx.fillStyle = "#F0F0F0";
          ctx.beginPath();
          ctx.roundRect(x + imgPadding, y + imgPadding, imgSize, imgSize, 12);
          ctx.fill();
          
          // Draw category emoji as fallback
          ctx.font = "64px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const emoji = getCategoryEmoji(label);
          ctx.fillText(emoji, x + itemSize / 2, y + itemSize / 2);
        }

        // Draw category label (outside try-catch so it always renders)
        ctx.fillStyle = "#2C2C2C";
        ctx.font = "600 16px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(label, x + itemSize / 2, y + itemSize + 30);
      }

      // Draw branding at bottom
      try {
        const logo = await loadImage(logoImage);
        const logoHeight = 40;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        const logoX = (width - logoWidth) / 2;
        const logoY = height - 100;
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("Error loading logo:", error);
      }

      // Draw website text
      ctx.fillStyle = "#666666";
      ctx.font = "18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Create your own at kikonasu.app", width / 2, height - 40);

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating outfit image:", error);
      toast({
        title: "Error",
        description: "Failed to generate outfit image",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `kikonasu-outfit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Track interaction
    trackShare("download");

    toast({
      title: "Downloaded!",
      description: "Outfit image saved to your device",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      trackShare("link");
      toast({
        title: "Link copied!",
        description: "Share this link with friends",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "outfit.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: "My Kikonasu Outfit",
          text: "Check out my outfit from Kikonasu!",
          files: [file],
        });

        trackShare("native");

        toast({
          title: "Shared!",
          description: "Outfit shared successfully",
        });
      } else {
        handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
        toast({
          title: "Error",
          description: "Failed to share outfit",
          variant: "destructive",
        });
      }
    }
  };

  const handleInstagramShare = () => {
    handleDownload();
    trackShare("instagram");
    toast({
      title: "Download complete!",
      description: "Open Instagram to share your outfit",
    });
  };

  const trackShare = async (platform: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_interactions").insert({
          user_id: user.id,
          interaction_type: "share",
          interaction_data: {
            platform,
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
      }
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Share Your Outfit</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {generating ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Generating your outfit image...</p>
                </div>
              </div>
            ) : (
              imageUrl && (
                <div className="space-y-4">
                  <img
                    src={imageUrl}
                    alt="Outfit preview"
                    className="w-full rounded-lg shadow-lg"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Image
                    </Button>

                    <Button onClick={handleNativeShare} variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>

                    <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                      <Link2 className="h-4 w-4" />
                      Copy Link
                    </Button>

                    <Button onClick={handleInstagramShare} variant="outline" className="gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Share your outfit and inspire others! 💫
                  </p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
