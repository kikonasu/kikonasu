import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Lock } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
}

interface CategoryRow {
  category: string;
  items: WardrobeItem[];
  currentItemId: string | null;
  isLocked: boolean;
}

interface HorizontalItemBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryRow[];
  onSelectItem: (category: string, item: WardrobeItem) => void;
  onToggleLock: (category: string) => void;
  onUnlockAll: () => void;
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

export const HorizontalItemBrowser = ({
  isOpen,
  onClose,
  categories,
  onSelectItem,
  onToggleLock,
  onUnlockAll,
}: HorizontalItemBrowserProps) => {
  if (!isOpen) return null;

  const hasLockedItems = categories.some(cat => cat.isLocked);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Browse & Build Your Outfit</h2>
          <div className="flex items-center gap-2">
            {hasLockedItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={onUnlockAll}
                className="text-xs"
              >
                🔓 Unlock All
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 space-y-8">
          {categories.map((categoryRow) => (
            <CategoryRowComponent
              key={categoryRow.category}
              categoryRow={categoryRow}
              onSelectItem={onSelectItem}
              onToggleLock={onToggleLock}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="container mx-auto">
          <Button
            size="lg"
            onClick={onClose}
            className="w-full"
          >
            Done - View Outfit
          </Button>
        </div>
      </div>
    </div>
  );
};

const CategoryRowComponent = ({
  categoryRow,
  onSelectItem,
  onToggleLock,
}: {
  categoryRow: CategoryRow;
  onSelectItem: (category: string, item: WardrobeItem) => void;
  onToggleLock: (category: string) => void;
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  };

  return (
    <div className="space-y-3">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCategoryEmoji(categoryRow.category)}</span>
          <h3 className="text-lg font-semibold text-foreground">{categoryRow.category}</h3>
          <span className="text-sm text-muted-foreground">({categoryRow.items.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleLock(categoryRow.category)}
          className={`
            transition-all
            ${categoryRow.isLocked 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-primary'
            }
          `}
        >
          <Lock className="h-4 w-4 mr-1" />
          {categoryRow.isLocked ? 'Locked' : 'Lock'}
        </Button>
      </div>

      {/* Scrollable Items Row */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {categoryRow.items.map((item) => {
            const isSelected = item.id === categoryRow.currentItemId;
            const hasError = imageErrors.has(item.id);

            return (
              <Card
                key={item.id}
                onClick={() => !categoryRow.isLocked && onSelectItem(categoryRow.category, item)}
                className={`
                  flex-shrink-0 w-40 sm:w-48 cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:ring-2 hover:ring-primary/50 border-border'
                  }
                  ${categoryRow.isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                `}
              >
                <CardContent className="p-0">
                  <div className="aspect-square rounded-t-lg overflow-hidden bg-secondary/20 relative">
                    {hasError ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                        <span className="text-5xl mb-2">{getCategoryEmoji(item.category)}</span>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    ) : (
                      <img
                        src={item.signedUrl || item.image_url}
                        alt={item.category}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(item.id)}
                      />
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="p-2 bg-primary/10 text-center">
                      <p className="text-xs font-medium text-primary">Selected</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
