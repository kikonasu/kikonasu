import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WardrobeItemImage } from "@/components/WardrobeItemImage";

interface EditClothesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    category: string;
    image_url: string;
  } | null;
  onItemUpdated: () => void;
}

const categories = ["Top", "Bottom", "Shoes", "Dress", "Outerwear", "Accessory"];

export const EditClothesDialog = ({ open, onOpenChange, item, onItemUpdated }: EditClothesDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!selectedCategory || !item) {
      toast.error("Please select a category");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("wardrobe_items")
        .update({ category: selectedCategory })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item updated successfully");
      onItemUpdated();
      onOpenChange(false);
      setSelectedCategory("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update item";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  // Reset selected category when dialog opens with new item
  const handleOpenChange = (open: boolean) => {
    if (open && item) {
      setSelectedCategory(item.category);
    } else {
      setSelectedCategory("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item Category</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20">
              <WardrobeItemImage
                imageUrl={item.image_url}
                category={item.category}
                itemId={item.id}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Current Category */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current category:</p>
              <p className="text-lg font-semibold capitalize">{item.category}</p>
            </div>

            {/* Category Selection */}
            <div>
              <p className="text-sm font-medium mb-3">Select new category:</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className="h-auto py-3"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!selectedCategory || updating || selectedCategory === item.category}
                className="flex-1"
              >
                {updating ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
