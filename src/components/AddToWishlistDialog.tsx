import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TemplateItem {
  id: string;
  name?: string;
  category: string;
  description?: string;
  price_range_low?: number;
  price_range_high?: number;
}

interface AddToWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateItem: TemplateItem;
  onSuccess?: () => void;
}

export const AddToWishlistDialog = ({
  open,
  onOpenChange,
  templateId,
  templateItem,
  onSuccess
}: AddToWishlistDialogProps) => {
  const [notes, setNotes] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to add items to wishlist");
        return;
      }

      const { error } = await supabase
        .from("capsule_wishlist")
        .insert({
          user_id: user.id,
          template_id: templateId,
          template_item_id: templateItem.id,
          item_name: templateItem.name || templateItem.description || 'Item',
          item_category: templateItem.category,
          item_description: templateItem.description,
          price_range_low: templateItem.price_range_low,
          price_range_high: templateItem.price_range_high,
          notes: notes || null,
          target_price: targetPrice ? parseFloat(targetPrice) : null,
        });

      if (error) throw error;

      toast.success(`Added "${templateItem.name}" to wishlist`);
      onOpenChange(false);
      setNotes("");
      setTargetPrice("");
      onSuccess?.();
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      const message = error instanceof Error ? error.message : "Failed to add to wishlist";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Wishlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium">{templateItem.name || templateItem.description}</p>
            <p className="text-sm text-muted-foreground">
              {templateItem.price_range_low && templateItem.price_range_high
                ? `$${templateItem.price_range_low} - $${templateItem.price_range_high}`
                : 'Price varies'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Wait for Black Friday, Need specific brand..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price (optional)</Label>
            <Input
              id="targetPrice"
              type="number"
              placeholder="e.g., 150"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Adding..." : "Add to Wishlist"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
