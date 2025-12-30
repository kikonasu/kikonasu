import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
}

interface OutfitPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishListItem: {
    id: string;
    image_url: string;
    category: string;
    signedUrl?: string;
  };
  wardrobeItems: WardrobeItem[];
  outfitCount: number;
}

export const OutfitPreviewModal = ({
  open,
  onOpenChange,
  wishListItem,
  wardrobeItems,
  outfitCount,
}: OutfitPreviewModalProps) => {
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);

  // Generate sample outfits based on the wish list item category
  const generateOutfits = () => {
    const outfits: WardrobeItem[][] = [];
    const category = wishListItem.category;

    // Get items by category
    const tops = wardrobeItems.filter(item => item.category === "Top");
    const bottoms = wardrobeItems.filter(item => item.category === "Bottom");
    const shoes = wardrobeItems.filter(item => item.category === "Shoes");
    const dresses = wardrobeItems.filter(item => item.category === "Dress");

    // Generate outfits based on wish list item category
    if (category === "Top") {
      bottoms.forEach(bottom => {
        shoes.forEach(shoe => {
          outfits.push([wishListItem as any, bottom, shoe]);
        });
      });
    } else if (category === "Bottom") {
      tops.forEach(top => {
        shoes.forEach(shoe => {
          outfits.push([top, wishListItem as any, shoe]);
        });
      });
    } else if (category === "Shoes") {
      tops.forEach(top => {
        bottoms.forEach(bottom => {
          outfits.push([top, bottom, wishListItem as any]);
        });
      });
      dresses.forEach(dress => {
        outfits.push([dress, wishListItem as any]);
      });
    } else if (category === "Dress") {
      shoes.forEach(shoe => {
        outfits.push([wishListItem as any, shoe]);
      });
    } else if (category === "Outerwear" || category === "Accessory") {
      // For outerwear/accessories, show with existing complete outfits
      tops.forEach(top => {
        bottoms.forEach(bottom => {
          shoes.forEach(shoe => {
            outfits.push([top, bottom, shoe, wishListItem as any]);
          });
        });
      });
      dresses.forEach(dress => {
        shoes.forEach(shoe => {
          outfits.push([dress, shoe, wishListItem as any]);
        });
      });
    }

    // Limit to first 10 outfits to keep it manageable
    return outfits.slice(0, Math.min(10, outfitCount));
  };

  const outfits = generateOutfits();
  const currentOutfit = outfits[currentOutfitIndex] || [];

  const handlePrevious = () => {
    setCurrentOutfitIndex((prev) => (prev === 0 ? outfits.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentOutfitIndex((prev) => (prev === outfits.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Outfit Potential Preview
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({currentOutfitIndex + 1} of {outfits.length})
            </span>
          </DialogTitle>
        </DialogHeader>

        {outfits.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Add more items to your wardrobe to see outfit combinations!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Outfit Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
              {currentOutfit.map((item, index) => (
                <div key={`${item.id}-${index}`} className="space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden bg-secondary border-2 border-border">
                    <img
                      src={item.signedUrl || item.image_url}
                      alt={item.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground capitalize">
                    {item.category}
                    {item.id === wishListItem.id && (
                      <span className="text-[hsl(var(--coral))] ml-1">✨ New</span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={outfits.length <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Swipe to see more outfit combinations
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={outfits.length <= 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
