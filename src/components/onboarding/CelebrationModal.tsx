import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface CelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  onViewOutfits: () => void;
}

export const CelebrationModal = ({ 
  open, 
  onOpenChange, 
  itemCount,
  onViewOutfits 
}: CelebrationModalProps) => {
  // Display a minimum number since we don't have exact category breakdown here
  const outfitCount = Math.max(10, Math.floor(itemCount / 2));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            <div className="text-4xl mb-2">🎉</div>
            Amazing! You've uploaded 10 items
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              You can now create <span className="text-primary font-bold">{outfitCount}+</span> different outfits!
            </p>
            <p className="text-sm text-muted-foreground">
              Ready to see what combinations we can make?
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center"
              >
                <Sparkles className="h-8 w-8 text-primary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              </div>
            ))}
          </div>

          <Button 
            onClick={onViewOutfits}
            size="lg"
            className="w-full shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            See My Outfits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
