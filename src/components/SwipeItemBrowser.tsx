import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WardrobeItemImage } from "@/components/WardrobeItemImage";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
}

interface SwipeItemBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  availableItems: WardrobeItem[];
  currentItem: WardrobeItem | null;
  onAccept: (item: WardrobeItem) => void;
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
  return (
    <WardrobeItemImage
      imageUrl={item.image_url}
      category={item.category}
      itemId={item.id}
      className={className || "w-full h-full object-cover"}
    />
  );
};

export const SwipeItemBrowser = ({
  isOpen,
  onClose,
  category,
  availableItems,
  currentItem,
  onAccept,
}: SwipeItemBrowserProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Filter out the current item from available items
  const items = availableItems.filter(item => item.id !== currentItem?.id);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSwipeDirection(null);
      setDragOffsetX(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleReject();
      else if (e.key === "ArrowRight" || e.key === "Enter") handleAccept();
      else if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, items]);

  if (!isOpen || items.length === 0) return null;

  const currentDisplayItem = items[currentIndex];

  const handleAccept = () => {
    setSwipeDirection("right");
    setTimeout(() => {
      onAccept(currentDisplayItem);
      toast({
        title: "Item selected!",
        description: `${category} updated in your outfit`,
      });
      onClose();
    }, 300);
  };

  const handleReject = () => {
    setSwipeDirection("left");
    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
      } else {
        // Loop back to start
        setCurrentIndex(0);
        setSwipeDirection(null);
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(items.length - 1);
    }
  };

  // Touch/Mouse drag handlers
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const offset = clientX - dragStartX;
    setDragOffsetX(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Swipe threshold: 100px
    if (Math.abs(dragOffsetX) > 100) {
      if (dragOffsetX > 0) {
        handleAccept();
      } else {
        handleReject();
      }
    }
    setDragOffsetX(0);
  };

  const rotation = isDragging ? (dragOffsetX / 20) : 
                   swipeDirection === "right" ? 20 : 
                   swipeDirection === "left" ? -20 : 0;

  const translateX = isDragging ? dragOffsetX : 
                     swipeDirection === "right" ? 500 : 
                     swipeDirection === "left" ? -500 : 0;

  const opacity = isDragging ? Math.max(0.5, 1 - Math.abs(dragOffsetX) / 200) :
                  swipeDirection ? 0 : 1;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/90 font-medium">
        <Badge variant="secondary" className="text-sm px-4 py-2">
          {currentIndex + 1} of {items.length} {category.toLowerCase()}s
        </Badge>
      </div>

      {/* Peek of next/previous items */}
      {items.length > 1 && (
        <>
          {/* Previous item peek (left) */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none hidden md:block">
            <div className="w-32 h-48 rounded-2xl overflow-hidden bg-card shadow-lg">
              <ItemImage
                item={items[(currentIndex - 1 + items.length) % items.length]}
                alt="Previous"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Next item peek (right) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none hidden md:block">
            <div className="w-32 h-48 rounded-2xl overflow-hidden bg-card shadow-lg">
              <ItemImage
                item={items[(currentIndex + 1) % items.length]}
                alt="Next"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </>
      )}

      {/* Main card */}
      <div className="relative w-full max-w-md mx-auto">
        <div
          className="relative touch-none select-none cursor-grab active:cursor-grabbing"
          style={{
            transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
            opacity,
            transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseMove={(e) => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
        >
          {/* Swipe indicators */}
          {isDragging && (
            <>
              <div
                className="absolute inset-0 border-4 border-green-500 rounded-3xl pointer-events-none z-10 transition-opacity"
                style={{ opacity: Math.max(0, dragOffsetX / 200) }}
              >
                <div className="absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-lg transform rotate-12">
                  ✓ LOVE IT
                </div>
              </div>
              <div
                className="absolute inset-0 border-4 border-red-500 rounded-3xl pointer-events-none z-10 transition-opacity"
                style={{ opacity: Math.max(0, -dragOffsetX / 200) }}
              >
                <div className="absolute top-8 left-8 bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-lg transform -rotate-12">
                  ✗ NOPE
                </div>
              </div>
            </>
          )}

          <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative aspect-[3/4] bg-secondary/20">
              <ItemImage
                item={currentDisplayItem}
                alt={category}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">{category}</h3>
              <p className="text-sm text-muted-foreground">
                Swipe right to add to outfit, left to skip
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-5 mt-8">
          {/* Previous button (Navigation) */}
          <button
            onClick={handlePrevious}
            className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 bg-background border border-border text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Reject button (Secondary) */}
          <button
            onClick={handleReject}
            className="h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 bg-background border-2 border-foreground text-foreground hover:bg-foreground/5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Accept button (Primary) */}
          <button
            onClick={handleAccept}
            className="h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          >
            <Check className="h-7 w-7" />
          </button>

          {/* Next button (Navigation) */}
          <button
            onClick={handleNext}
            className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 bg-background border border-border text-foreground hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop hint */}
        <p className="text-center text-white/60 text-sm mt-6 hidden md:block">
          Use ← → arrow keys or drag the card
        </p>
      </div>
    </div>
  );
};
