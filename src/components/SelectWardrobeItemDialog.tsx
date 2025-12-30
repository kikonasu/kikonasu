import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SelectWardrobeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  wardrobeItems: any[];
  wishListItems?: any[];
  includeWishList?: boolean;
  onSelect: (item: any) => void;
  currentItemId?: string;
  templateItem?: {
    id: string;
    description: string;
    placeholder_image?: string;
  };
  onUseStockImage?: () => void;
}

export const SelectWardrobeItemDialog = ({
  open,
  onOpenChange,
  category,
  wardrobeItems,
  wishListItems = [],
  includeWishList = false,
  onSelect,
  currentItemId,
  templateItem,
  onUseStockImage
}: SelectWardrobeItemDialogProps) => {
  // Helper function to parse description from ai_analysis
  const getItemDescription = (item: any): string => {
    if (!item.ai_analysis) return 'Unnamed item';
    
    try {
      // ai_analysis is wrapped in ```json ... ```
      const jsonMatch = item.ai_analysis.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.description || parsed.category || 'Unnamed item';
      }
    } catch (e) {
      console.error('Error parsing ai_analysis:', e);
    }
    
    return item.ai_analysis || 'Unnamed item';
  };

  // Helper function to get color from ai_analysis
  const getItemColor = (item: any): string | null => {
    if (!item.ai_analysis) return null;
    
    try {
      const jsonMatch = item.ai_analysis.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.color || null;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return null;
  };

  // Filter wardrobe items by category
  const wardrobeCategoryItems = wardrobeItems.filter(item => 
    item && item.category && item.category.toLowerCase() === category.toLowerCase()
  );

  // Filter wish list items by category if enabled
  const wishListCategoryItems = includeWishList ? wishListItems.filter(item =>
    item && item.category && item.category.toLowerCase() === category.toLowerCase()
  ) : [];

  // Combine both lists
  const categoryItems = [...wardrobeCategoryItems, ...wishListCategoryItems];
  
  const wardrobeCount = wardrobeCategoryItems.length;
  const wishListCount = wishListCategoryItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select {category}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {wardrobeCount} in wardrobe
            {includeWishList && wishListCount > 0 && ` + ${wishListCount} in wish list`}
            {" "}({categoryItems.length} total)
          </p>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {categoryItems.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No {category.toLowerCase()} items in your wardrobe yet.</p>
              {includeWishList && wishListCount === 0 && wardrobeCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tip: If you have items in your Wish List but they're not showing up, make sure they're categorized correctly. You can edit items from the Wish List page.
                </p>
              )}
              {templateItem && onUseStockImage && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">You can use the stock image instead:</p>
                  <Card className="max-w-xs mx-auto p-4 space-y-3">
                    <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden">
                      {templateItem.placeholder_image?.startsWith('/') ? (
                        <img 
                          src={templateItem.placeholder_image} 
                          alt={templateItem.description}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          {templateItem.placeholder_image || '📦'}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center">{templateItem.description}</p>
                    <Button 
                      onClick={() => {
                        onUseStockImage();
                        onOpenChange(false);
                      }}
                      className="w-full"
                    >
                      Use This Image
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoryItems.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:border-primary relative ${
                    currentItemId === item.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    onSelect(item);
                    onOpenChange(false);
                  }}
                >
                  <div className="relative w-full h-40 bg-muted rounded-t-lg overflow-hidden">
                    {item.isWishListItem && (
                      <div className="absolute top-2 right-2 z-10 bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Wish List</span>
                      </div>
                    )}
                    {item.signedUrl || item.image_url ? (
                      <img
                        src={item.signedUrl || item.image_url}
                        alt={getItemDescription(item)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm line-clamp-2">
                      {getItemDescription(item)}
                    </p>
                    {getItemColor(item) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getItemColor(item)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                      {item.isWishListItem && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                          Wish List
                        </Badge>
                      )}
                    </div>
                    {currentItemId === item.id && (
                      <span className="text-xs text-primary font-medium">Currently Selected</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between gap-2">
          {templateItem && onUseStockImage && categoryItems.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                onUseStockImage();
                onOpenChange(false);
              }}
            >
              Use Stock Image Instead
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="ml-auto">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
