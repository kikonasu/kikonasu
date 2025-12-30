import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateOutfits, calculateCategoryBreakdown, getCategoryEmoji } from "@/lib/capsuleCalculations";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
}

interface SavedCapsule {
  id: string;
  name: string;
  item_ids: string[];
  total_outfits: number;
}

interface EditCapsuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capsule: SavedCapsule | null;
  allWardrobeItems: WardrobeItem[];
  onSave: (capsuleId: string, newItemIds: string[]) => Promise<void>;
}

export const EditCapsuleDialog = ({
  open,
  onOpenChange,
  capsule,
  allWardrobeItems,
  onSave
}: EditCapsuleDialogProps) => {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (capsule) {
      setSelectedItemIds(capsule.item_ids);
    }
  }, [capsule]);

  if (!capsule) return null;

  const selectedItems = allWardrobeItems.filter(item => 
    selectedItemIds.includes(item.id)
  );

  const availableItems = allWardrobeItems.filter(item => 
    !selectedItemIds.includes(item.id)
  );

  const totalOutfits = calculateOutfits(selectedItems);
  const breakdown = calculateCategoryBreakdown(selectedItems);

  const removeItem = (itemId: string) => {
    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    toast({
      title: "Item removed",
      description: "Item removed from capsule"
    });
  };

  const addItem = (itemId: string) => {
    setSelectedItemIds(prev => [...prev, itemId]);
    toast({
      title: "Item added",
      description: "Item added to capsule"
    });
  };

  const handleSave = async () => {
    if (selectedItemIds.length < 10) {
      toast({
        title: "Not enough items",
        description: "Capsule needs at least 10 items",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(capsule.id, selectedItemIds);
      toast({
        title: "Capsule updated! ✨",
        description: `Now creates ${totalOutfits} outfits from ${selectedItemIds.length} items`
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving capsule:", error);
      toast({
        title: "Error",
        description: "Failed to update capsule",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Group items by category
  const itemsByCategory = selectedItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  const categories = Object.keys(itemsByCategory).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>Edit "{capsule.name}"</span>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {selectedItemIds.length} items
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Outfit Counter */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Total Outfit Combinations</p>
                <p className="text-5xl font-bold text-primary">{totalOutfits}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">
                  {totalOutfits > capsule.total_outfits && (
                    <span className="text-green-600">+{totalOutfits - capsule.total_outfits} more! 📈</span>
                  )}
                  {totalOutfits < capsule.total_outfits && (
                    <span className="text-orange-600">-{capsule.total_outfits - totalOutfits} fewer</span>
                  )}
                  {totalOutfits === capsule.total_outfits && (
                    <span className="text-muted-foreground">No change</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Previously: {capsule.total_outfits} outfits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { category: 'Top', emoji: '👕' },
            { category: 'Bottom', emoji: '👖' },
            { category: 'Shoes', emoji: '👟' },
            { category: 'Outerwear', emoji: '🧥' }
          ].map(({ category, emoji }) => {
            const count = breakdown.find(b => b.category === category)?.count || 0;
            return (
              <div key={category} className="text-center space-y-1 p-3 bg-secondary/20 rounded-lg">
                <div className="text-3xl">{emoji}</div>
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground">{category}</div>
              </div>
            );
          })}
        </div>

        {/* Current Items by Category */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Items</h3>
            <Button
              onClick={() => setShowAddItems(!showAddItems)}
              variant={showAddItems ? "secondary" : "default"}
              size="sm"
            >
              {showAddItems ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Items
                </>
              )}
            </Button>
          </div>

          {showAddItems ? (
            <>
              {/* Category Filters */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={activeCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </Button>
                {['Top', 'Bottom', 'Shoes', 'Dress', 'Outerwear', 'Accessory'].map(cat => {
                  const count = availableItems.filter(i => i.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                    >
                      {getCategoryEmoji(cat)} {cat} ({count})
                    </Button>
                  );
                })}
              </div>

              {/* Available Items Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-2">
                {availableItems
                  .filter(item => !activeCategory || item.category === activeCategory)
                  .map(item => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => addItem(item.id)}
                    >
                      <CardContent className="p-0 relative">
                        <div className="aspect-square rounded-t-lg overflow-hidden bg-secondary/20">
                          <img
                            src={item.signedUrl || item.image_url}
                            alt={item.category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm text-white rounded-full p-1.5">
                          <Plus className="w-3 h-3" />
                        </div>
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium">{item.category}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </>
          ) : (
            <>
              {categories.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No items in capsule. Add some items to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                categories.map(category => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryEmoji(category)}</span>
                      <h4 className="font-semibold">{category}</h4>
                      <Badge variant="secondary">{itemsByCategory[category].length}</Badge>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {itemsByCategory[category].map(item => (
                        <Card
                          key={item.id}
                          className="group relative hover:ring-2 hover:ring-destructive transition-all"
                        >
                          <CardContent className="p-0 relative">
                            <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20">
                              <img
                                src={item.signedUrl || item.image_url}
                                alt={item.category}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeItem(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedItemIds.length < 10}
            className="flex-1"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
