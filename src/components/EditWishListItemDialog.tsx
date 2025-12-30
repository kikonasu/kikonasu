import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface EditWishListItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    category: string;
    notes: string | null;
    ai_analysis: string | null;
    affiliate_link?: string | null;
  } | null;
  onItemUpdated: () => void;
}

type Category = "Top" | "Bottom" | "Shoes" | "Dress" | "Outerwear" | "Accessory";

export const EditWishListItemDialog = ({ 
  open, 
  onOpenChange, 
  item,
  onItemUpdated 
}: EditWishListItemDialogProps) => {
  const isMobile = useIsMobile();
  const [category, setCategory] = useState<Category | null>(null);
  const [notes, setNotes] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setCategory(item.category as Category);
      setNotes(item.notes || "");
      setAffiliateLink(item.affiliate_link || "");
    }
  }, [item]);

  const handleSave = async () => {
    if (!item || !category) {
      toast.error("Please select a category");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("wish_list_items")
        .update({
          category,
          notes: notes.trim() || null,
          affiliate_link: affiliateLink.trim() || null,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Item updated successfully");
      onItemUpdated();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update item";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getItemDescription = (): string => {
    if (!item?.ai_analysis) return 'Item';
    
    try {
      const jsonMatch = item.ai_analysis.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.description || parsed.category || 'Item';
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    return item.ai_analysis || 'Item';
  };

  const content = (
    <div className="space-y-6 pb-safe">
      <div className="space-y-2">
        <Label>Item</Label>
        <p className="text-sm text-muted-foreground">{getItemDescription()}</p>
      </div>

      <div className="space-y-2">
        <Label>Category *</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["Top", "Bottom", "Shoes", "Dress", "Outerwear", "Accessory"] as Category[]).map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              onClick={() => setCategory(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="e.g., Blue blazer from J.Crew - $200"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Store Link / Website</Label>
        <Input
          id="link"
          type="url"
          placeholder="https://..."
          value={affiliateLink}
          onChange={(e) => setAffiliateLink(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="flex-1"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1"
          disabled={saving || !category}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Edit Wish List Item</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Wish List Item</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
