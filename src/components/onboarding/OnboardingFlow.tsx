import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Upload, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddClothesDialog } from "@/components/AddClothesDialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import kikonasuLogo from "@/assets/kikonasu-logo-optimized.webp";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [itemsUploaded, setItemsUploaded] = useState(0);
  const navigate = useNavigate();

  // Check initial item count
  useEffect(() => {
    checkItemCount();
  }, []);

  const checkItemCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { count } = await supabase
      .from('wardrobe_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    setItemsUploaded(count || 0);
  };

  const handleGetStarted = () => {
    setStep(2);
  };

  const handleStartUpload = () => {
    setShowUploadDialog(true);
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    // Refresh item count
    checkItemCount();
  };

  const handleContinueToOutfits = () => {
    setStep(3);
  };

  const handleExploreWardrobe = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/wardrobe');
    onComplete();
  };

  const handleCreateFirstOutfit = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/todays-look');
    onComplete();
  };

  const handleSkip = () => {
    // Mark onboarding as completed so user isn't stuck in loop
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="max-w-2xl w-full p-8 md:p-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <img 
                  src={kikonasuLogo} 
                  alt="Kikonasu" 
                  className="h-16 w-auto md:h-20"
                />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to Kikonasu!
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Your AI-powered wardrobe assistant
              </p>
            </div>

            <div className="space-y-6 py-6">
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Upload your clothes and let AI help you create amazing outfits tailored to your style and the weather
              </p>

              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-xl bg-card/50 border border-primary/10">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Smart Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    AI automatically categorizes your clothes
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card/50 border border-primary/10">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Outfit Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized outfit suggestions daily
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card/50 border border-primary/10">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Trip Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Pack smart with weather-ready outfits
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="w-full md:w-auto px-8 text-lg shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    const progress = Math.min((itemsUploaded / 3) * 100, 100);
    const isComplete = itemsUploaded >= 3;

    return (
      <>
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <Card className="max-w-2xl w-full p-8 md:p-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                  Step 1 of 2
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">
                  Let's Build Your Digital Wardrobe
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Take photos of your clothes or upload existing images. Our AI will automatically categorize them.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {itemsUploaded === 0 ? "Get started by uploading your first item" : 
                     isComplete ? "Great! You're ready to continue" :
                     `Upload ${3 - itemsUploaded} more ${3 - itemsUploaded === 1 ? 'item' : 'items'}`}
                  </span>
                  <span className="font-bold text-primary">
                    {itemsUploaded}/3 items
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="space-y-3">
                {!isComplete ? (
                  <>
                    <Button
                      onClick={handleStartUpload}
                      size="lg"
                      className="w-full text-lg shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      {itemsUploaded === 0 ? "Upload Your First Item" : "Upload More Items"}
                    </Button>
                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="w-full"
                    >
                      I'll do this later
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleContinueToOutfits}
                    size="lg"
                    className="w-full text-lg shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <AddClothesDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          onItemAdded={handleUploadComplete}
        />
      </>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="max-w-2xl w-full p-8 md:p-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                Step 2 of 2
              </div>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent/50 mb-4">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Create Your First Outfit?
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Our AI will analyze your wardrobe and suggest perfectly coordinated outfits based on the weather and your style preferences.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCreateFirstOutfit}
                size="lg"
                className="w-full md:w-auto px-8 text-lg shadow-[var(--shadow-medium)] hover:scale-105 transition-transform"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Generate My First Outfit
              </Button>
              <div>
                <Button
                  onClick={handleExploreWardrobe}
                  variant="outline"
                  size="lg"
                  className="w-full md:w-auto px-8 text-lg"
                >
                  Explore My Wardrobe
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};
