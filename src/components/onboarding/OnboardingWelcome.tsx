import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";

interface OnboardingWelcomeProps {
  itemCount: number;
  onAddItem: () => void;
}

export const OnboardingWelcome = ({ itemCount, onAddItem }: OnboardingWelcomeProps) => {
  const progress = (itemCount / 10) * 100;
  const isFirstItem = itemCount === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 rounded-2xl p-8 shadow-[var(--shadow-soft)] border border-primary/10">
        <div className="text-center space-y-6">
          {isFirstItem && (
            <div className="text-6xl mb-4">👕</div>
          )}
          
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              {isFirstItem ? (
                <>Your wardrobe is empty. Let's add your first item!</>
              ) : (
                <>
                  <span className="text-[hsl(var(--cta))]">Your wardrobe.</span>{" "}
                  <span className="text-primary">Infinite possibilities</span>
                </>
              )}
            </h2>
            <p className="text-xl text-muted-foreground">
              {isFirstItem 
                ? "Start by photographing items you wear often - it takes just 5 minutes"
                : "Smart outfit suggestions from clothes you already own, perfectly matched to the weather and your style"}
            </p>
            {!isFirstItem && (
              <p className="text-lg text-muted-foreground pt-2">
                Add {10 - itemCount} more {10 - itemCount === 1 ? 'item' : 'items'} to unlock outfit generation!
              </p>
            )}
          </div>

          {!isFirstItem && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-muted-foreground">Your progress</span>
                <span className="text-primary font-bold">{itemCount}/10 items uploaded</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          <Button
            onClick={onAddItem}
            size="lg"
            className="shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
          >
            <Plus className="mr-2 h-5 w-5" />
            {isFirstItem ? "Add Your First Item" : "Add Next Item"}
          </Button>
          
          {isFirstItem && (
            <p className="text-sm text-muted-foreground">
              💡 Tip: Start by photographing items you wear often
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
