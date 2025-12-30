import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Camera, Upload, Sparkles, Heart, Calendar, ShoppingBag,
  Palette, ChevronRight, ChevronLeft, Check, X, Shirt,
  Luggage, History, Star
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  image?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Kikonasu!",
    description: "Your smart wardrobe assistant that helps you create amazing outfits from clothes you already own. Let's walk through everything you can do.",
    icon: <Star className="w-8 h-8" />,
    tips: [
      "This tutorial will take about 2 minutes",
      "You can access this anytime by clicking the ? button",
      "Let's get started!"
    ]
  },
  {
    id: "upload",
    title: "Step 1: Upload Your Clothes",
    description: "Start by photographing items from your wardrobe. The more items you add, the more outfit combinations become possible!",
    icon: <Camera className="w-8 h-8" />,
    tips: [
      "Take photos with good lighting on a plain background",
      "Upload at least 10 items for best results",
      "Include tops, bottoms, shoes, and accessories",
      "You can edit item details after uploading"
    ]
  },
  {
    id: "categories",
    title: "Step 2: Organize by Category",
    description: "Each item is automatically categorized, but you can adjust it. Categories help our AI create better outfit combinations.",
    icon: <Shirt className="w-8 h-8" />,
    tips: [
      "Categories: Top, Bottom, Dress, Shoes, Outerwear, Accessory",
      "Add colors and styles for smarter matching",
      "Mark items as formal, casual, or both",
      "Set seasons (summer, winter, all-season)"
    ]
  },
  {
    id: "outfits",
    title: "Step 3: Generate Outfits",
    description: "This is where the magic happens! Our AI creates outfit combinations from your wardrobe, considering style, color harmony, and weather.",
    icon: <Sparkles className="w-8 h-8" />,
    tips: [
      "Click 'Create Outfits' or 'Today's Look' to generate",
      "Swipe or click to see different combinations",
      "The AI learns from your preferences over time",
      "Weather-appropriate suggestions when location is enabled"
    ]
  },
  {
    id: "favorites",
    title: "Step 4: Save Your Favorites",
    description: "Found an outfit you love? Save it to your favorites for quick access later. Build your personal lookbook!",
    icon: <Heart className="w-8 h-8" />,
    tips: [
      "Tap the heart icon to save an outfit",
      "Access favorites from the main menu",
      "Great for planning what to wear ahead of time",
      "Share your favorite outfits with friends"
    ]
  },
  {
    id: "history",
    title: "Step 5: Track Your History",
    description: "See all the outfits you've generated and worn. Discover patterns in your style and find forgotten combinations.",
    icon: <History className="w-8 h-8" />,
    tips: [
      "View outfits by date",
      "See your most-worn items",
      "Identify items you never wear",
      "Track your style evolution"
    ]
  },
  {
    id: "trips",
    title: "Step 6: Plan Your Trips",
    description: "Going somewhere? Create a packing plan with outfits for each day. Never overpack or forget essentials again!",
    icon: <Luggage className="w-8 h-8" />,
    tips: [
      "Set trip dates and destination",
      "Assign outfits to each day",
      "Get a packing checklist automatically",
      "Consider the weather at your destination"
    ]
  },
  {
    id: "wishlist",
    title: "Step 7: Build Your Wish List",
    description: "See a piece you want? Add it to your wish list and see how many new outfits it could create with your existing wardrobe.",
    icon: <ShoppingBag className="w-8 h-8" />,
    tips: [
      "Add items you're considering buying",
      "See outfit potential before you buy",
      "Save links to stores",
      "Shop smarter, not more"
    ]
  },
  {
    id: "capsule",
    title: "Step 8: Explore Capsule Wardrobes",
    description: "Capsule wardrobes are curated collections of versatile pieces. Browse templates or create your own minimal wardrobe.",
    icon: <Palette className="w-8 h-8" />,
    tips: [
      "Browse pre-made capsule templates",
      "Create custom capsules for specific occasions",
      "See what items you need to complete a look",
      "Perfect for travel or seasonal wardrobes"
    ]
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You now know everything about Kikonasu. Start uploading your clothes and discover amazing outfit combinations!",
    icon: <Check className="w-8 h-8" />,
    tips: [
      "Start with 10+ items for best results",
      "Generate outfits daily to train the AI",
      "Access this tutorial anytime via the ? button",
      "Have fun exploring your style!"
    ]
  }
];

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TutorialModal = ({ open, onOpenChange }: TutorialModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const getStepColor = (stepId: string) => {
    const colors: Record<string, string> = {
      welcome: "from-violet-500 to-purple-600",
      upload: "from-blue-500 to-cyan-500",
      categories: "from-emerald-500 to-teal-500",
      outfits: "from-pink-500 to-rose-500",
      favorites: "from-red-500 to-pink-500",
      history: "from-amber-500 to-orange-500",
      trips: "from-sky-500 to-blue-500",
      wishlist: "from-fuchsia-500 to-pink-500",
      capsule: "from-indigo-500 to-violet-500",
      complete: "from-green-500 to-emerald-500",
    };
    return colors[stepId] || "from-gray-500 to-gray-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 gap-0">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${getStepColor(step.id)} p-6 text-white relative`}>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-4">
            {tutorialSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all ${
                  idx === currentStep
                    ? "w-6 bg-white"
                    : idx < currentStep
                    ? "w-2 bg-white/60"
                    : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
          <p className="text-white/90 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tips */}
          <div className="space-y-3 mb-6">
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {tutorialSteps.length}
            </span>

            <Button onClick={handleNext} className="gap-1">
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;
