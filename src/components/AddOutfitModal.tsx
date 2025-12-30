import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddOutfitModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (occasion: string, occasionLabel: string, timeOfDay: string) => Promise<void>;
  dayNumber: number;
}

const occasionOptions = [
  { value: "work", label: "👔 Work/Professional", emoji: "👔" },
  { value: "casual", label: "👕 Casual Daytime", emoji: "👕" },
  { value: "evening", label: "🌙 Evening Event", emoji: "🌙" },
  { value: "athletic", label: "🏃 Athletic/Gym", emoji: "🏃" },
  { value: "formal", label: "🎩 Formal/Black Tie", emoji: "🎩" },
  { value: "date", label: "💑 Date Night", emoji: "💑" },
  { value: "beach", label: "🏖️ Beach/Pool", emoji: "🏖️" },
  { value: "physical_work", label: "🔨 Physical Work", emoji: "🔨" },
  { value: "travel", label: "✈️ Travel/Commute", emoji: "✈️" },
  { value: "custom", label: "✏️ Custom", emoji: "✏️" },
];

const timeOptions = [
  { value: "any", label: "Any time" },
  { value: "morning", label: "Morning" },
  { value: "daytime", label: "Daytime" },
  { value: "evening", label: "Evening" },
];

export const AddOutfitModal = ({ open, onClose, onAdd, dayNumber }: AddOutfitModalProps) => {
  console.log("🎭 AddOutfitModal render", { open, dayNumber });
  const isMobile = useIsMobile();
  const [occasion, setOccasion] = useState("casual");
  const [customLabel, setCustomLabel] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("any");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    console.log("🎯 Add outfit clicked", { occasion, customLabel, timeOfDay, dayNumber });
    
    // Validate inputs
    if (occasion === "custom" && !customLabel.trim()) {
      console.error("❌ Custom label is required");
      setError("Please enter a custom occasion name");
      return;
    }

    console.log("🔄 Setting generating state...");
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log("📞 Calling onAdd handler...");
      const label = occasion === "custom" ? customLabel : "";
      await onAdd(occasion, label, timeOfDay);
      
      console.log("✅ Outfit added successfully!");
      
      // Reset state after successful add
      setOccasion("casual");
      setCustomLabel("");
      setTimeOfDay("any");
      setError(null);
      console.log("🚪 Closing modal after success");
      onClose();
    } catch (error) {
      console.error("❌ Error in handleAdd:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add outfit. Please try again.";
      console.error("💬 Error message:", errorMessage);
      setError(errorMessage);
      // Don't close the modal on error, let user see the error and retry
    } finally {
      console.log("🏁 Setting generating to false");
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating) {
      console.log("⚠️ Cannot close modal while generating");
      return;
    }
    setOccasion("casual");
    setCustomLabel("");
    setTimeOfDay("any");
    setError(null);
    onClose();
  };

  const selectedOccasion = occasionOptions.find(o => o.value === occasion);

  const formContent = (
    <>
      <div className="space-y-4 py-4">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label>What's this outfit for?</Label>
          <Select value={occasion} onValueChange={setOccasion} disabled={isGenerating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {occasionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {occasion === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="custom-label">Custom Occasion Name</Label>
            <Input
              id="custom-label"
              placeholder="e.g., Wedding, Presentation, Concert"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              disabled={isGenerating}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Time of Day (Optional)</Label>
          <Select value={timeOfDay} onValueChange={setTimeOfDay} disabled={isGenerating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button 
          onClick={handleAdd}
          disabled={isGenerating || (occasion === "custom" && !customLabel.trim())}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Outfit"
          )}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer 
        open={open} 
        onOpenChange={(newOpen) => {
          if (!newOpen && !isGenerating) {
            handleClose();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add Outfit for Day {dayNumber}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && !isGenerating) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Outfit for Day {dayNumber}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
