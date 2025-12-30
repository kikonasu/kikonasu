import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Luggage, Heart, Palette, TrendingUp, Calendar, Shirt, X, ChevronRight, MoreVertical, LogOut, Settings, User, ShoppingBag, Upload, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import kikonasuLogo from "@/assets/kikonasu-logo-optimized.webp";
import { useTheme } from "@/hooks/useTheme";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { TutorialModal } from "@/components/TutorialModal";
import { InteractiveTour } from "@/components/InteractiveTour";

interface WardrobeStats {
  totalItems: number;
  outfitsThisWeek: number;
  wishListCount: number;
  nextTripDays: number | null;
  nextTripName: string | null;
}

interface MostWornItem {
  id: string;
  image_url: string;
  category: string;
  wearCount: number;
}

interface WishListItem {
  id: string;
  image_url: string;
  category: string;
  notes: string | null;
  outfit_potential: number;
  affiliate_link: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<WardrobeStats>({
    totalItems: 0,
    outfitsThisWeek: 0,
    wishListCount: 0,
    nextTripDays: null,
    nextTripName: null,
  });
  const [mostWornItems, setMostWornItems] = useState<MostWornItem[]>([]);
  const [unusedItems, setUnusedItems] = useState<MostWornItem[]>([]);
  const [wishListItems, setWishListItems] = useState<WishListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTip, setShowTip] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showInteractiveTour, setShowInteractiveTour] = useState(false);
  const isMobile = useIsMobile();

  // Helper function to get full Supabase storage URL
  const getStorageUrl = (path: string | null) => {
    if (!path) {
      console.log("No image path provided");
      return null;
    }
    const fullUrl = `${supabase.storage.from('wardrobe-images').getPublicUrl(path).data.publicUrl}`;
    console.log(`Converting path "${path}" to URL: ${fullUrl}`);
    return fullUrl;
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    // Check if user needs onboarding
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from('wardrobe_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setOnboardingChecked(true);
      
      // Check if onboarding was already completed/skipped
      const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
      
      // Show onboarding ONLY if user has 0 items AND hasn't completed/skipped onboarding
      if (count === 0 && !onboardingCompleted) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      
      // If user has items now, mark onboarding as completed
      if (count && count > 0) {
        localStorage.setItem('onboarding_completed', 'true');
      }
    }
    
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get wardrobe count
      const { count: wardrobeCount } = await supabase
        .from("wardrobe_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get outfits from this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: outfitsCount } = await supabase
        .from("outfit_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", oneWeekAgo.toISOString());

      // Get wish list count
      const { count: wishListCount } = await supabase
        .from("wish_list_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get next trip
      const { data: upcomingTrips } = await supabase
        .from("suitcases")
        .select("trip_name, start_date")
        .eq("user_id", user.id)
        .gte("start_date", new Date().toISOString().split("T")[0])
        .order("start_date", { ascending: true })
        .limit(1);

      let nextTripDays = null;
      let nextTripName = null;
      if (upcomingTrips && upcomingTrips.length > 0) {
        const tripDate = new Date(upcomingTrips[0].start_date);
        const today = new Date();
        nextTripDays = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        nextTripName = upcomingTrips[0].trip_name;
      }

      setStats({
        totalItems: wardrobeCount || 0,
        outfitsThisWeek: outfitsCount || 0,
        wishListCount: wishListCount || 0,
        nextTripDays,
        nextTripName,
      });

      // Calculate most worn items
      const { data: outfitHistory } = await supabase
        .from("outfit_history")
        .select("top_item_id, bottom_item_id, dress_item_id, shoes_item_id, outerwear_item_id, accessory_item_id")
        .eq("user_id", user.id);

      if (outfitHistory) {
        const itemCounts = new Map<string, number>();
        outfitHistory.forEach((outfit) => {
          [outfit.top_item_id, outfit.bottom_item_id, outfit.dress_item_id, 
           outfit.shoes_item_id, outfit.outerwear_item_id, outfit.accessory_item_id]
            .filter((id) => id !== null)
            .forEach((id) => {
              itemCounts.set(id!, (itemCounts.get(id!) || 0) + 1);
            });
        });

        // Get top 5 most worn items
        const sortedItems = Array.from(itemCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        if (sortedItems.length > 0) {
          const { data: itemDetails, error: itemsError } = await supabase
            .from("wardrobe_items")
            .select("id, image_url, category")
            .in("id", sortedItems.map(([id]) => id));

          if (itemsError) {
            console.error("Error fetching wardrobe items:", itemsError);
          }

          if (itemDetails) {
            const itemsWithCounts = itemDetails.map((item) => ({
              ...item,
              wearCount: itemCounts.get(item.id) || 0,
            })).sort((a, b) => b.wearCount - a.wearCount);
            console.log("Most worn items with images:", itemsWithCounts);
            setMostWornItems(itemsWithCounts);
          }
        }

        // Find unused items (not in any outfit)
        const usedItemIds = new Set(itemCounts.keys());
        const { data: allItems } = await supabase
          .from("wardrobe_items")
          .select("id, image_url, category")
          .eq("user_id", user.id);

        if (allItems) {
          const unused = allItems
            .filter((item) => !usedItemIds.has(item.id))
            .map((item) => ({ ...item, wearCount: 0 }))
            .slice(0, 4);
          setUnusedItems(unused);
        }
      }

      // Get wish list items sorted by outfit potential
      const { data: wishList, error: wishListError } = await supabase
        .from("wish_list_items")
        .select("id, image_url, category, notes, outfit_potential, affiliate_link")
        .eq("user_id", user.id)
        .order("outfit_potential", { ascending: false })
        .limit(6);

      if (wishListError) {
        console.error("Error fetching wish list items:", wishListError);
      }

      if (wishList) {
        console.log("Wish list items with images:", wishList);
        setWishListItems(wishList);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Some dashboard data couldn't be loaded",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Sparkles,
      title: "Create an Outfit",
      description: "Generate your next look",
      path: "/todays-look",
      color: "from-primary/20 to-primary/5",
    },
    {
      icon: Luggage,
      title: "Plan a Trip",
      description: "Pack smart for travel",
      path: "/suitcases",
      color: "from-secondary/20 to-secondary/5",
    },
    {
      icon: Heart,
      title: "Favourites",
      description: "Your saved outfit combinations",
      path: "/favorites",
      color: "from-accent/20 to-accent/5",
    },
    {
      icon: Palette,
      title: "Explore Capsules",
      description: "Curated wardrobe collections",
      path: "/capsule",
      color: "from-muted/40 to-muted/10",
    },
  ];

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  if (loading || !onboardingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={() => {
          setShowOnboarding(false);
          checkAuthAndLoadData();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kikonasuLogo} alt="Kikonasu" className="h-8 w-auto" />
            <span className="text-xl font-semibold text-foreground">Kikonasu</span>
          </div>
          <div className="flex items-center gap-2">
            <div data-tour="theme-toggle">
              <ThemeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-accent"
                  data-tour="menu-button"
                >
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/wardrobe")} className="cursor-pointer">
                  <Shirt className="h-4 w-4 mr-2" />
                  Wardrobe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wishlist")} className="cursor-pointer">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Wish List
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/style")} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Style Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "Settings will be available soon",
                    });
                  }}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/auth");
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-accent"
              onClick={() => setShowInteractiveTour(true)}
              data-tour="help-button"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help & Tutorial</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Interactive Tour */}
      <InteractiveTour isOpen={showInteractiveTour} onClose={() => setShowInteractiveTour(false)} />

      {/* Tutorial Modal (fallback) */}
      <TutorialModal open={showTutorial} onOpenChange={setShowTutorial} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section - Quick Actions */}
        <section className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8">Your style command center</p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-tour="quick-actions">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const tourId = index === 0 ? "create-outfit" : index === 1 ? "plan-trip" : undefined;
              return (
                <Card
                  key={action.path}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 border-border/50 group"
                  onClick={() => navigate(action.path)}
                  data-tour={tourId}
                >
                  <CardHeader className="p-4 md:pb-3 md:px-6 md:pt-6">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 md:mb-3 transition-transform group-hover:scale-110`}>
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
                    </div>
                    <CardTitle className="text-sm md:text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-xs md:text-sm hidden md:block">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Wardrobe Setup Progress Banner */}
        {stats.totalItems < 10 && (
          <section className="mb-8 md:mb-12" data-tour="wardrobe-progress">
            <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">Complete Your Wardrobe Setup</CardTitle>
                    <CardDescription className="text-base">
                      {stats.totalItems === 0 && "Get started by uploading your first item"}
                      {stats.totalItems >= 1 && stats.totalItems <= 4 && "Great start! Add more for better outfit combinations"}
                      {stats.totalItems >= 5 && stats.totalItems <= 9 && `Almost there! Just ${10 - stats.totalItems} more ${10 - stats.totalItems === 1 ? 'item' : 'items'} to go`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      {stats.totalItems} of 10 items uploaded
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      {Math.round((stats.totalItems / 10) * 100)}%
                    </span>
                  </div>
                  <Progress value={(stats.totalItems / 10) * 100} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload at least 10 items to unlock the full power of AI outfit suggestions
                </p>
                <Button 
                  onClick={() => navigate("/wardrobe")}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add More Items
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Style Dashboard Stats */}
        <section className="mb-8 md:mb-12" data-tour="stats">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Your Style Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Wardrobe Size</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats.totalItems}</div>
                <p className="text-sm text-muted-foreground mt-1">items in your closet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats.outfitsThisWeek}</div>
                <p className="text-sm text-muted-foreground mt-1">outfits created</p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate("/wishlist")}
            >
              <CardHeader className="pb-2">
                <CardDescription>Wish List</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats.wishListCount}</div>
                <p className="text-sm text-muted-foreground mt-1">items you're eyeing</p>
              </CardContent>
            </Card>

            {stats.nextTripDays !== null ? (
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate("/suitcases")}
              >
                <CardHeader className="pb-2">
                  <CardDescription>Next Trip</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground">{stats.nextTripDays}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    days until {stats.nextTripName}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/suitcases")}>
                <CardHeader className="pb-2">
                  <CardDescription>Next Trip</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">—</div>
                  <p className="text-sm text-muted-foreground mt-1">No trips planned yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Most Worn Items Leaderboard */}
        {mostWornItems.length > 0 && (
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Your Wardrobe MVPs</h2>
            
            {isMobile ? (
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {mostWornItems.slice(0, 5).map((item, index) => (
                    <CarouselItem key={item.id} className="pl-2 basis-1/2 sm:basis-1/3">
                      <Card className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative aspect-square bg-muted">
                          {item.image_url ? (
                            <img
                              src={getStorageUrl(item.image_url) || ''}
                              alt={item.category}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onLoad={(e) => {
                                console.log(`MVP image loaded successfully: ${item.category}`, item.image_url);
                              }}
                              onError={(e) => {
                                console.error(`MVP image failed to load: ${item.category}`, item.image_url, 'Full URL:', getStorageUrl(item.image_url));
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.fallback-icon')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'fallback-icon absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50';
                                  fallback.innerHTML = `
                                    <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-xs">${item.category}</span>
                                  `;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                              <Shirt className="h-12 w-12" />
                              <span className="text-xs capitalize">{item.category}</span>
                            </div>
                          )}
                          {index < 3 && (
                            <div className="absolute top-2 right-2 text-2xl drop-shadow-lg">{getMedalEmoji(index)}</div>
                          )}
                        </div>
                        <CardContent className="p-2">
                          <p className="text-xs font-medium text-foreground capitalize truncate">{item.category}</p>
                          <p className="text-xs text-muted-foreground">Worn {item.wearCount}x</p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {mostWornItems.map((item, index) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-square bg-muted">
                      {item.image_url ? (
                        <img
                          src={getStorageUrl(item.image_url) || ''}
                          alt={item.category}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={(e) => {
                            console.log(`MVP image loaded successfully: ${item.category}`, item.image_url);
                          }}
                          onError={(e) => {
                            console.error(`MVP image failed to load: ${item.category}`, item.image_url, 'Full URL:', getStorageUrl(item.image_url));
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-icon absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50';
                              fallback.innerHTML = `
                                <svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span class="text-xs">${item.category}</span>
                              `;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                          <Shirt className="h-16 w-16" />
                          <span className="text-xs capitalize">{item.category}</span>
                        </div>
                      )}
                      {index < 3 && (
                        <div className="absolute top-2 right-2 text-3xl drop-shadow-lg">{getMedalEmoji(index)}</div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground capitalize">{item.category}</p>
                      <p className="text-xs text-muted-foreground">Worn {item.wearCount} times</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Wish List Carousel */}
        <section className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Items You're Eyeing</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Your wish list highlights</p>
            </div>
            {wishListItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/wishlist")}
                className="gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {wishListItems.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {wishListItems.map((item) => (
                  <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                      onClick={() => navigate("/wishlist")}
                    >
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={getStorageUrl(item.image_url) || ''}
                            alt={item.category}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onLoad={(e) => {
                              console.log(`Wish list image loaded successfully: ${item.category}`, item.image_url);
                            }}
                            onError={(e) => {
                              console.error(`Wish list image failed to load: ${item.category}`, item.image_url, 'Full URL:', getStorageUrl(item.image_url));
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-icon absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50';
                                fallback.innerHTML = `
                                  <svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                  </svg>
                                  <span class="text-xs capitalize">${item.category}</span>
                                `;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/50">
                            <Heart className="h-16 w-16" />
                            <span className="text-xs capitalize">{item.category}</span>
                          </div>
                        )}
                        {item.outfit_potential > 0 && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold shadow-lg">
                            +{item.outfit_potential}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-foreground capitalize mb-1">{item.category}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.notes}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Sparkles className="h-3 w-3" />
                          <span>{item.outfit_potential} new outfits possible</span>
                        </div>
                        {item.affiliate_link && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Store link available
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" />
              <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Start Your Wish List</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Save items you're considering and see what outfits you could create
                </p>
                <Button onClick={() => navigate("/wishlist")}>
                  Add Your First Item
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Smart Suggestions */}
        {unusedItems.length > 0 && (
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Suggested for You</h2>
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Items Ready for Their Debut</CardTitle>
                <CardDescription className="text-xs md:text-sm">These items haven't been worn yet</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {unusedItems.slice(0, isMobile ? 2 : unusedItems.length).map((item) => (
                    <div key={item.id} className="text-center">
                      <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted relative">
                        <img
                          src={getStorageUrl(item.image_url) || ''}
                          alt={item.category}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoad={(e) => {
                            console.log(`Unused item image loaded successfully: ${item.category}`, item.image_url);
                          }}
                          onError={(e) => {
                            console.error(`Unused item image failed to load: ${item.category}`, item.image_url, 'Full URL:', getStorageUrl(item.image_url));
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-icon absolute inset-0 flex items-center justify-center text-muted-foreground';
                              fallback.innerHTML = `<svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Feature Discovery */}
        {showTip && (
          <section>
            <Card className="bg-muted/30 border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Style Tip</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowTip(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create outfits regularly to help us learn your style preferences and provide better recommendations.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;
