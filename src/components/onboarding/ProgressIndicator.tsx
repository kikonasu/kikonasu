import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  itemCount: number;
  items?: Array<{ category: string }>;
}

export const ProgressIndicator = ({ itemCount, items = [] }: ProgressIndicatorProps) => {
  // Count items by category
  const categoryCounts = items.reduce((acc, item) => {
    const cat = item.category.toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tops = categoryCounts['top'] || 0;
  const bottoms = categoryCounts['bottom'] || 0;
  const shoes = categoryCounts['shoes'] || 0;
  const dresses = categoryCounts['dress'] || 0;
  const outerwear = categoryCounts['outerwear'] || 0;

  // Check if user can make outfits
  const canMakeOutfits = (tops > 0 && bottoms > 0 && shoes > 0) || (dresses > 0 && shoes > 0);
  
  if (itemCount >= 10) {
    if (canMakeOutfits) {
      // Calculate actual outfit combinations
      // Either top+bottom+shoes OR dress+shoes
      const topBottomShoesCombos = tops * bottoms * shoes;
      const dressShoesCombs = dresses * shoes;
      const totalCombos = topBottomShoesCombos + dressShoesCombs;
      const displayCount = totalCombos > 100 ? '100+' : totalCombos;
      
      return (
        <div className="bg-muted/30 border-y border-border py-3">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-foreground">
              🎉 Congratulations! You can now make <span className="font-bold">{displayCount}</span> outfits
            </p>
          </div>
        </div>
      );
    } else {
      // Show what's missing
      const missing = [];
      if (tops === 0 && dresses === 0) missing.push('a top or dress');
      else if (tops === 0) missing.push('a top');
      if (bottoms === 0 && dresses === 0 && tops > 0) missing.push('bottoms');
      if (shoes === 0) missing.push('shoes');
      
      return (
        <div className="bg-muted/50 border-y border-border py-3">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Add {missing.join(' and ')} to start creating outfits
            </p>
          </div>
        </div>
      );
    }
  }

  const progress = (itemCount / 10) * 100;
  
  // Build category breakdown string
  const categoryParts = [];
  if (tops > 0) categoryParts.push(`${tops} top${tops > 1 ? 's' : ''}`);
  if (bottoms > 0) categoryParts.push(`${bottoms} bottom${bottoms > 1 ? 's' : ''}`);
  if (shoes > 0) categoryParts.push(`${shoes} shoe${shoes > 1 ? 's' : ''}`);
  if (dresses > 0) categoryParts.push(`${dresses} dress${dresses > 1 ? 'es' : ''}`);
  if (outerwear > 0) categoryParts.push(`${outerwear} outerwear`);
  
  const categoryBreakdown = categoryParts.length > 0 ? ` (${categoryParts.join(', ')})` : '';
  
  // Determine helpful message
  let helpMessage = "";
  if (itemCount >= 5) {
    const canMakeOutfits = (tops > 0 && bottoms > 0 && shoes > 0) || (dresses > 0 && shoes > 0);
    if (!canMakeOutfits) {
      const missing = [];
      if (tops === 0 && dresses === 0) missing.push('a top or dress');
      else if (tops === 0) missing.push('a top');
      if (bottoms === 0 && dresses === 0 && tops > 0) missing.push('bottoms');
      if (shoes === 0) missing.push('shoes');
      helpMessage = `Add ${missing.join(' and ')} to unlock outfits!`;
    } else {
      helpMessage = "You're so close! Almost there 🎉";
    }
  } else {
    const encouragementMessages = [
      "Great start! Keep going 🎯",
      "You're doing great! Keep adding items 🌟",
      "Almost halfway there! Keep it up 💪"
    ];
    const messageIndex = Math.min(Math.floor(itemCount / 2), encouragementMessages.length - 1);
    helpMessage = encouragementMessages[messageIndex];
  }

  return (
    <div className="bg-card/50 border-b border-border py-3">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-muted-foreground">{helpMessage}</span>
            <span className="text-foreground font-bold">{itemCount}/10 items{categoryBreakdown}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </div>
  );
};
