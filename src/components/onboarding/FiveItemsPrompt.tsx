import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";

interface FiveItemsPromptProps {
  onViewOutfits: () => void;
  onDismiss: () => void;
}

export const FiveItemsPrompt = ({ onViewOutfits, onDismiss }: FiveItemsPromptProps) => {
  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-card border border-primary/20 rounded-2xl p-6 shadow-[var(--shadow-elevated)] z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">
              You can already make outfits!
            </h3>
            <p className="text-sm text-muted-foreground">
              Want to see what's possible?
            </p>
          </div>
        </div>
        
        <Button 
          onClick={onViewOutfits}
          className="w-full shadow-[var(--shadow-soft)]"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          View Outfit Suggestions
        </Button>
      </div>
    </div>
  );
};
