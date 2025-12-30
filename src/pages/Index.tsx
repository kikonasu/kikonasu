import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { Plus, HelpCircle } from "lucide-react";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";
import { AddClothesDialog } from "@/components/AddClothesDialog";
import { EditClothesDialog } from "@/components/EditClothesDialog";
import { WardrobeGrid } from "@/components/WardrobeGrid";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { FiveItemsPrompt } from "@/components/onboarding/FiveItemsPrompt";
import { CelebrationModal } from "@/components/onboarding/CelebrationModal";
import { SmartNudge } from "@/components/onboarding/SmartNudge";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TutorialModal } from "@/components/TutorialModal";

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  city: string;
}

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [addClothesOpen, setAddClothesOpen] = useState(false);
  const [editClothesOpen, setEditClothesOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showFiveItemsPrompt, setShowFiveItemsPrompt] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasShownFiveItemsPrompt, setHasShownFiveItemsPrompt] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  const getWeatherEmoji = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '⛅';
      case 'rain':
      case 'drizzle':
        return '🌧️';
      case 'snow':
        return '❄️';
      case 'thunderstorm':
        return '⛈️';
      default:
        return '☁️';
    }
  };

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { lat: latitude, lon: longitude },
      });

      if (error) throw error;
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchWeather();
        checkAdminStatus(session.user.id);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchWeather();
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Check for onboarding milestones
  useEffect(() => {
    const fiveItemsShown = localStorage.getItem('fiveItemsPromptShown');
    const celebrationShown = localStorage.getItem('celebrationShown');
    const welcomeShown = localStorage.getItem('welcomeModalShown');
    
    setHasShownFiveItemsPrompt(fiveItemsShown === 'true');
    setHasShownCelebration(celebrationShown === 'true');
    
    // Show welcome modal ONLY for new users with empty wardrobes
    if (session && !wardrobeLoading && wardrobeItems.length === 0 && welcomeShown !== 'true') {
      setShowWelcomeModal(true);
      localStorage.setItem('welcomeModalShown', 'true');
    }
  }, [session, wardrobeItems.length, wardrobeLoading]);

  // Show prompts based on item count
  useEffect(() => {
    if (!session || wardrobeItems.length === 0) return;

    // Show 5-item prompt
    if (wardrobeItems.length === 5 && !hasShownFiveItemsPrompt && canCreateOutfits()) {
      setShowFiveItemsPrompt(true);
      localStorage.setItem('fiveItemsPromptShown', 'true');
      setHasShownFiveItemsPrompt(true);
    }

    // Show celebration at 10 items
    if (wardrobeItems.length === 10 && !hasShownCelebration) {
      setShowCelebrationModal(true);
      localStorage.setItem('celebrationShown', 'true');
      setHasShownCelebration(true);
    }
  }, [wardrobeItems.length, session, hasShownFiveItemsPrompt, hasShownCelebration]);

  const handleViewOutfits = () => {
    setShowFiveItemsPrompt(false);
    setShowCelebrationModal(false);
    navigate("/todays-look");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const canCreateOutfits = () => {
    const hasTop = wardrobeItems.some(item => item.category === "Top");
    const hasBottom = wardrobeItems.some(item => item.category === "Bottom");
    const hasShoes = wardrobeItems.some(item => item.category === "Shoes");
    const hasDress = wardrobeItems.some(item => item.category === "Dress");
    
    // User needs EITHER (Top + Bottom + Shoes) OR (Dress + Shoes)
    return (hasTop && hasBottom && hasShoes) || (hasDress && hasShoes);
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setEditClothesOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If not logged in, show landing page
  if (!session) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--secondary))] to-[hsl(var(--accent)/0.1)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--accent)/0.08),transparent_50%)]" />
          
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              {/* Logo */}
              <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <img 
                  src={logoImage} 
                  alt="Kikonasu Logo" 
                  className="h-24 w-24 object-contain drop-shadow-lg"
                />
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <span className="text-foreground">Transform Your Wardrobe Into</span>{" "}
                <span className="text-foreground">Endless Possibilities</span>
              </h1>

              {/* Subheading */}
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                Smart outfit suggestions from clothes you already own, perfectly matched to the weather and your style
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <Button 
                  variant="default" 
                  onClick={() => navigate("/signup")}
                  className="rounded-full text-lg px-8 py-6 shadow-[var(--shadow-medium)] hover:scale-105"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/auth")}
                  className="rounded-full text-lg px-8 py-6"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
              <FeatureCard
                title="Smart Organisation"
                description="Digitise your wardrobe and organise your clothes effortlessly"
              />
              <FeatureCard
                title="Outfit Inspiration"
                description="Get personalised outfit suggestions based on your style"
              />
              <FeatureCard
                title="Maximise Your Closet"
                description="Rediscover forgotten pieces and create new combinations"
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If logged in, show main app
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate("/")} className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Kikonasu" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground hidden xs:block truncate">Kikonasu</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs sm:text-sm px-2 sm:px-4">
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/favorites")} className="text-xs sm:text-sm px-2 sm:px-4">
              Favourites
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="text-xs sm:text-sm px-2 sm:px-4">
              History
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/suitcases")} className="text-xs sm:text-sm px-2 sm:px-4">
              📅 Plans
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wishlist")} className="text-xs sm:text-sm px-2 sm:px-4">
              🛍️ Wish List
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/style-profile")} className="text-xs sm:text-sm px-2 sm:px-4">
              📊 Style
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-xs sm:text-sm px-2 sm:px-4">
                📊 Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm px-2 sm:px-4">
              Sign Out
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setShowTutorial(true)}
            >
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Help & Tutorial</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tutorial Modal */}
      <TutorialModal open={showTutorial} onOpenChange={setShowTutorial} />

      {/* Progress Indicator */}
      {wardrobeItems.length < 15 && (
        <ProgressIndicator itemCount={wardrobeItems.length} items={wardrobeItems} />
      )}

      {/* Action Bar */}
      <div className="border-b border-border bg-card/30 sticky top-[73px] z-40">
        {/* Weather Display */}
        {weather && !weatherLoading && (
          <div className="container mx-auto px-4 pt-4">
            <div className="text-center p-3 bg-card/50 rounded-xl border border-border">
              <p className="text-sm font-medium text-foreground">
                {weather.temperature}°C {getWeatherEmoji(weather.condition)} {weather.condition} in {weather.city}
              </p>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            My Wardrobe {wardrobeItems.length > 0 && `(${wardrobeItems.length} items)`}
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button
              onClick={() => setAddClothesOpen(true)}
              className="shadow-[var(--shadow-soft)] text-sm flex-1 sm:flex-none"
              size="sm"
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4" />
              Add Item
            </Button>
            <Button
              disabled={!canCreateOutfits()}
              onClick={() => navigate("/capsule")}
              className="shadow-[var(--shadow-soft)] text-sm flex-1 sm:flex-none"
              size="sm"
              variant="outline"
            >
              📦 Build Capsule
            </Button>
            <Button
              disabled={!canCreateOutfits()}
              onClick={() => navigate("/todays-look")}
              className="shadow-[var(--shadow-soft)] text-sm flex-1 sm:flex-none"
              size="sm"
            >
              ✨ Create Outfits
            </Button>
          </div>
        </div>
        {wardrobeItems.length > 0 && !canCreateOutfits() && (
          <div className="container mx-auto px-4 pb-3">
            <p className="text-xs text-muted-foreground text-right">
              Need either (Top + Bottom + Shoes) or (Dress + Shoes) to create outfits
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Headline - Always visible */}
        {wardrobeItems.length === 0 && (
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="text-foreground">Transform Your Wardrobe Into</span>{" "}
              <span className="text-foreground">Endless Possibilities</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Smart outfit suggestions from clothes you already own, perfectly matched to the weather and your style
            </p>
          </div>
        )}
        
        {!wardrobeLoading && wardrobeItems.length < 3 && (
          <OnboardingWelcome 
            itemCount={wardrobeItems.length}
            onAddItem={() => setAddClothesOpen(true)}
          />
        )}
        
        {!wardrobeLoading && wardrobeItems.length >= 3 && wardrobeItems.length < 10 && !canCreateOutfits() && (
          <SmartNudge 
            items={wardrobeItems}
            onAddItem={() => setAddClothesOpen(true)}
          />
        )}
        
        <WardrobeGrid
          onAddClick={() => setAddClothesOpen(true)}
          onItemsChange={setWardrobeItems}
          onLoadingChange={setWardrobeLoading}
          refreshTrigger={refreshTrigger}
          onEditClick={handleEditClick}
        />
      </main>

      {/* Five Items Prompt */}
      {showFiveItemsPrompt && (
        <FiveItemsPrompt
          onViewOutfits={handleViewOutfits}
          onDismiss={() => setShowFiveItemsPrompt(false)}
        />
      )}

      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcomeModal}
        onOpenChange={setShowWelcomeModal}
        onGetStarted={() => {
          setShowWelcomeModal(false);
          setAddClothesOpen(true);
        }}
      />

      {/* Celebration Modal */}
      <CelebrationModal
        open={showCelebrationModal}
        onOpenChange={setShowCelebrationModal}
        itemCount={wardrobeItems.length}
        onViewOutfits={handleViewOutfits}
      />

      <AddClothesDialog
        open={addClothesOpen}
        onOpenChange={setAddClothesOpen}
        onItemAdded={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      <EditClothesDialog
        open={editClothesOpen}
        onOpenChange={setEditClothesOpen}
        item={editingItem}
        onItemUpdated={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)] hover:scale-105">
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const ActionCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
  <div className="bg-gradient-to-br from-card to-secondary/30 rounded-2xl p-8 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)] hover:scale-105 cursor-pointer">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-2xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
