import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetStarted: () => void;
}

export const WelcomeModal = ({ 
  open, 
  onOpenChange,
  onGetStarted 
}: WelcomeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Welcome to Kikonasu! 👋
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-center text-muted-foreground">
            Here's how it works:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Upload 10+ items from your wardrobe</h3>
                <p className="text-sm text-muted-foreground">
                  Takes just 5 minutes - snap photos of your favourite clothes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">We'll auto-categorise them</h3>
                <p className="text-sm text-muted-foreground">
                  Tops, bottoms, shoes, outerwear - all organised automatically
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Generate weather-smart outfit combinations</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalised outfit suggestions matched to the weather
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onGetStarted}
            size="lg"
            className="w-full shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
