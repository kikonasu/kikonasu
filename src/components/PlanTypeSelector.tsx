import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Plane, CalendarRange } from "lucide-react";

interface PlanTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: 'trip' | 'week' | 'custom') => void;
}

export const PlanTypeSelector = ({ open, onClose, onSelect }: PlanTypeSelectorProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>What are you planning?</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Trip Away */}
          <button
            onClick={() => onSelect('trip')}
            className="text-left p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-secondary/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">🧳 Trip Away</h3>
                <p className="text-sm text-muted-foreground">
                  Plan outfits for travel with destination weather forecasts
                </p>
              </div>
            </div>
          </button>

          {/* This Week */}
          <button
            onClick={() => onSelect('week')}
            className="text-left p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-secondary/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">📅 This Week</h3>
                <p className="text-sm text-muted-foreground">
                  Plan your outfits for the week ahead with local weather
                </p>
              </div>
            </div>
          </button>

          {/* Custom Plan */}
          <button
            onClick={() => onSelect('custom')}
            className="text-left p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-secondary/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <CalendarRange className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">📆 Custom Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Plan outfits for any date range with flexible options
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
