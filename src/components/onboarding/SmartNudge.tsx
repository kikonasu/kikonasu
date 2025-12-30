import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface WardrobeItem {
  id: string;
  category: string;
  image_url: string;
}

interface SmartNudgeProps {
  items: WardrobeItem[];
  onAddItem: () => void;
}

export const SmartNudge = ({ items, onAddItem }: SmartNudgeProps) => {
  // Count items by category
  const counts = {
    tops: items.filter(item => item.category === "Top").length,
    bottoms: items.filter(item => item.category === "Bottom").length,
    shoes: items.filter(item => item.category === "Shoes").length,
    dresses: items.filter(item => item.category === "Dress").length,
  };

  // Determine what's missing
  const missing: string[] = [];
  const hasTopBottomShoes = counts.tops > 0 && counts.bottoms > 0 && counts.shoes > 0;
  const hasDressShoes = counts.dresses > 0 && counts.shoes > 0;

  if (!hasTopBottomShoes && !hasDressShoes) {
    // Need at least one complete outfit path
    if (counts.shoes === 0) {
      missing.push("shoes");
    }
    
    // Check if they need tops/bottoms or dress
    const needsTopBottom = counts.tops === 0 || counts.bottoms === 0;
    const needsDress = counts.dresses === 0;
    
    if (needsTopBottom && needsDress) {
      // Need both paths
      if (counts.tops === 0 && counts.bottoms === 0) {
        missing.push("tops and bottoms");
      } else if (counts.tops === 0) {
        missing.push("some tops (shirts, t-shirts, sweaters)");
      } else if (counts.bottoms === 0) {
        missing.push("1-2 bottoms (pants, skirts, shorts)");
      }
      missing.push("or a dress");
    } else if (needsTopBottom) {
      // Only need top/bottom path
      if (counts.tops === 0) {
        missing.push("some tops (shirts, t-shirts, sweaters)");
      }
      if (counts.bottoms === 0) {
        missing.push("1-2 bottoms (pants, skirts, shorts)");
      }
    } else if (needsDress) {
      // Only need dress path
      missing.push("a dress");
    }
  }

  // Build "what you have" message
  const have: string[] = [];
  if (counts.tops > 0) have.push(`${counts.tops} ${counts.tops === 1 ? 'top' : 'tops'}`);
  if (counts.bottoms > 0) have.push(`${counts.bottoms} ${counts.bottoms === 1 ? 'bottom' : 'bottoms'}`);
  if (counts.dresses > 0) have.push(`${counts.dresses} ${counts.dresses === 1 ? 'dress' : 'dresses'}`);
  if (counts.shoes > 0) have.push(`${counts.shoes} ${counts.shoes === 1 ? 'pair of shoes' : 'pairs of shoes'}`);

  const haveText = have.length > 0 
    ? have.join(", ").replace(/, ([^,]*)$/, " and $1") 
    : "some items";

  return (
    <div className="bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5 border border-primary/10 rounded-2xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              You're getting close!
            </h3>
            <p className="text-sm text-muted-foreground">
              You have: <span className="text-foreground font-medium">{haveText}</span>
            </p>
          </div>

          {missing.length > 0 && (
            <div className="bg-card/50 rounded-lg p-3 border border-border/50">
              <p className="text-sm text-foreground">
                <span className="font-medium">To create outfits, add:</span>{" "}
                <span className="text-primary">{missing.join(", ")}</span>
              </p>
            </div>
          )}

          <Button 
            onClick={onAddItem}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Add Next Item
          </Button>
        </div>
      </div>
    </div>
  );
};
