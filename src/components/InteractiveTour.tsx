import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, MousePointer2 } from "lucide-react";

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  spotlightPadding?: number;
  showCursor?: boolean; // Show animated cursor
  cursorAction?: "click" | "hover" | "drag"; // What the cursor does
  fallbackImage?: string; // If element not found, show this image
  demo?: React.ReactNode; // Custom demo content to show
  showSpotlight?: boolean; // Show spotlight even when centered
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='welcome']",
    title: "Welcome to Kikonasu!",
    content: "Let's take a quick interactive tour of your smart wardrobe assistant. We'll highlight each feature as we go!",
    placement: "center",
    demo: (
      <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-xl p-6 text-center">
        <div className="text-6xl mb-4">👋</div>
        <p className="text-sm text-muted-foreground">This tour will show you exactly where everything is</p>
      </div>
    ),
  },
  {
    target: "[data-tour='quick-actions']",
    title: "Quick Actions",
    content: "These cards are your main hub. Tap any card to jump straight into that feature - create outfits, plan trips, view favorites, or explore capsule wardrobes.",
    placement: "bottom",
    showCursor: true,
    cursorAction: "hover",
    spotlightPadding: 16,
  },
  {
    target: "[data-tour='create-outfit']",
    title: "Create an Outfit",
    content: "This is where the magic happens! Click here to generate AI-powered outfit combinations from your wardrobe items.",
    placement: "bottom",
    showCursor: true,
    cursorAction: "click",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='plan-trip']",
    title: "Plan a Trip",
    content: "Going somewhere? Create a packing plan with outfits for each day. Never overpack again!",
    placement: "bottom",
    showCursor: true,
    cursorAction: "click",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='stats']",
    title: "Your Style Stats",
    content: "Track your wardrobe size, outfits created this week, wish list items, and upcoming trips at a glance.",
    placement: "center",
    spotlightPadding: 16,
    showSpotlight: true,
  },
  {
    target: "[data-tour='wardrobe-progress']",
    title: "Wardrobe Progress",
    content: "See how many items you've uploaded. Add at least 10 items to unlock the full power of AI outfit suggestions!",
    placement: "bottom",
    spotlightPadding: 12,
  },
  {
    target: "[data-tour='menu-button']",
    title: "Navigation Menu",
    content: "Tap the three dots to access all features: Wardrobe, Wish List, Style Profile, Settings, and Sign Out.",
    placement: "left",
    showCursor: true,
    cursorAction: "click",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='theme-toggle']",
    title: "Dark/Light Mode",
    content: "Toggle between dark and light themes based on your preference.",
    placement: "left",
    showCursor: true,
    cursorAction: "click",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='help-button']",
    title: "Need Help?",
    content: "Click this button anytime to restart this tour or get help with using Kikonasu.",
    placement: "left",
    spotlightPadding: 8,
  },
  {
    target: "[data-tour='upload-section']",
    title: "Upload Your Clothes",
    content: "Start by photographing items from your wardrobe. The more items you add, the more outfit combinations become possible!",
    placement: "center",
    demo: (
      <div className="space-y-4">
        <div className="bg-muted rounded-xl p-4 relative overflow-hidden">
          <div className="grid grid-cols-3 gap-2">
            {["👕", "👖", "👟", "👗", "🧥", "👜"].map((emoji, i) => (
              <div key={i} className="aspect-square bg-background rounded-lg flex items-center justify-center text-2xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                {emoji}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-muted to-transparent" />
        </div>
        <p className="text-xs text-muted-foreground text-center">Upload tops, bottoms, shoes, dresses, outerwear & accessories</p>
      </div>
    ),
  },
  {
    target: "[data-tour='complete']",
    title: "You're All Set!",
    content: "You now know your way around Kikonasu. Start exploring and create amazing outfits from clothes you already own!",
    placement: "center",
    demo: (
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-sm text-muted-foreground">Click "Finish" to start using Kikonasu!</p>
      </div>
    ),
  },
];

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveTour = ({ isOpen, onClose }: InteractiveTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [animatedRect, setAnimatedRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursorAnimation, setShowCursorAnimation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  // Find and measure the target element
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step.target]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [updateTargetRect]);

  // Smoothly animate the spotlight rect
  useEffect(() => {
    if (targetRect) {
      const padding = step.spotlightPadding || 8;
      setAnimatedRect({
        x: targetRect.left - padding,
        y: targetRect.top - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      });
    }
  }, [targetRect, step.spotlightPadding]);

  // Animate cursor when step has showCursor
  useEffect(() => {
    if (!step.showCursor || !targetRect) {
      setShowCursorAnimation(false);
      return;
    }

    setShowCursorAnimation(true);
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;

    // Start cursor from bottom right, move to target
    const startX = window.innerWidth - 100;
    const startY = window.innerHeight - 100;

    setCursorPosition({ x: startX, y: startY });

    const animationTimeout = setTimeout(() => {
      setCursorPosition({ x: centerX, y: centerY });
    }, 300);

    // Simulate click animation
    const clickTimeout = setTimeout(() => {
      if (step.cursorAction === "click") {
        const cursor = document.getElementById("tour-cursor");
        if (cursor) {
          cursor.classList.add("scale-75");
          setTimeout(() => cursor.classList.remove("scale-75"), 150);
        }
      }
    }, 1200);

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(clickTimeout);
    };
  }, [step, targetRect]);

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const getTooltipPosition = () => {
    if (!targetRect || step.placement === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = step.spotlightPadding || 0;
    const tooltipWidth = 420;
    const tooltipHeight = 320;
    const margin = 20;
    const viewportPadding = 20; // Minimum distance from viewport edges

    let top: number;
    let left: number;
    let transform = "";

    switch (step.placement) {
      case "top":
        top = targetRect.top - tooltipHeight - margin - padding;
        left = targetRect.left + targetRect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "bottom":
        top = targetRect.bottom + margin + padding;
        left = targetRect.left + targetRect.width / 2;
        transform = "translateX(-50%)";
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - margin - padding;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + margin + padding;
        break;
      default:
        return {};
    }

    // Clamp top position to stay within viewport
    if (top < viewportPadding) {
      top = viewportPadding;
    }
    if (top + tooltipHeight > window.innerHeight - viewportPadding) {
      top = window.innerHeight - tooltipHeight - viewportPadding;
    }

    // Clamp left position to stay within viewport
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    if (left + tooltipWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - tooltipWidth - viewportPadding;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform,
    };
  };

  if (!isOpen) return null;

  const showSpotlightCutout = targetRect && (step.placement !== "center" || step.showSpotlight);

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ transition: "all 0.5s ease-out" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {showSpotlightCutout && (
              <rect
                x={animatedRect.x}
                y={animatedRect.y}
                width={animatedRect.width}
                height={animatedRect.height}
                rx="12"
                fill="black"
                style={{ transition: "all 0.5s ease-out" }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border glow */}
      {showSpotlightCutout && (
        <div
          className="absolute border-2 border-primary rounded-xl animate-pulse pointer-events-none"
          style={{
            left: animatedRect.x,
            top: animatedRect.y,
            width: animatedRect.width,
            height: animatedRect.height,
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)",
            transition: "all 0.5s ease-out",
          }}
        />
      )}

      {/* Animated cursor */}
      {showCursorAnimation && (
        <div
          id="tour-cursor"
          className="absolute pointer-events-none transition-all duration-1000 ease-out z-[10000]"
          style={{
            left: cursorPosition.x,
            top: cursorPosition.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <MousePointer2 className="w-8 h-8 text-white drop-shadow-lg" fill="white" />
          {step.cursorAction === "click" && (
            <div className="absolute top-6 left-6 w-4 h-4 bg-primary rounded-full animate-ping" />
          )}
        </div>
      )}

      {/* Tooltip */}
      <div
        className="absolute w-[420px] max-w-[90vw] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[10001]"
        style={{
          ...getTooltipPosition(),
          transition: "all 0.5s ease-out",
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground font-medium">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>

          {/* Demo content or description */}
          {step.demo ? (
            <div className="mb-6">{step.demo}</div>
          ) : (
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">{step.content}</p>
          )}

          {!step.demo && step.content && (
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">{step.content}</p>
          )}

          {/* Navigation */}
          <div className="pt-6 border-t border-border space-y-5">
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {tourSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentStep
                      ? "bg-primary w-6"
                      : idx < currentStep
                      ? "bg-primary/50 w-2.5"
                      : "bg-muted-foreground/30 w-2.5"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={isFirstStep}
                className="gap-2 px-6 py-5"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button onClick={handleNext} className="gap-2 px-8 py-5 flex-1 max-w-[200px]">
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={handleClose}
        className="fixed bottom-6 right-6 text-white/60 hover:text-white text-sm underline z-[10001]"
      >
        Skip tour
      </button>
    </div>,
    document.body
  );
};

export default InteractiveTour;
