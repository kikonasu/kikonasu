import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, TrendingUp, Heart, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";
import { getSignedUrl } from "@/lib/storageUtils";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
}

interface ItemUsage {
  itemId: string;
  count: number;
  item: WardrobeItem;
}

interface OccasionPreference {
  occasion: string;
  count: number;
}

interface StylePreferences {
  topItems: ItemUsage[];
  occasionPreferences: OccasionPreference[];
}

const StyleProfile = () => {
  const [preferences, setPreferences] = useState<StylePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch existing preferences
      const { data: prefs, error } = await supabase
        .from("user_style_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      // If no preferences exist, just show empty state
      // Don't try to compute if user has no data yet
      if (!prefs) {
        console.log("No preferences found, showing empty state");
        setPreferences(null);
        setLoading(false);
        return;
      }

      if (prefs) {
        console.log("Found existing preferences:", prefs);
        
        // Fetch wardrobe items to populate details
        const { data: wardrobe, error: wardrobeError } = await supabase
          .from("wardrobe_items")
          .select("*")
          .eq("user_id", user.id);

        if (wardrobeError) {
          console.error("Error fetching wardrobe:", wardrobeError);
        }

        const itemUsageMap = prefs.item_usage as Record<string, number>;
        const topItems = Object.entries(itemUsageMap || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([itemId, count]) => ({
            itemId,
            count,
            item: wardrobe?.find((w) => w.id === itemId),
          }))
          .filter((item) => item.item);

        // Generate signed URLs
        const itemsWithUrls = await Promise.all(
          topItems.map(async (usage) => ({
            ...usage,
            item: {
              ...usage.item,
              signedUrl: await getSignedUrl(usage.item.image_url),
            },
          }))
        );

        // Type assertion for occasion preferences
        const occasionPrefs = Array.isArray(prefs.occasion_preferences) 
          ? prefs.occasion_preferences as unknown as OccasionPreference[]
          : [];

        console.log(`Loaded ${itemsWithUrls.length} top items and ${occasionPrefs.length} occasion preferences`);

        setPreferences({
          topItems: itemsWithUrls as ItemUsage[],
          occasionPreferences: occasionPrefs,
        });
      } else {
        console.log("No preferences found in database");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load style preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const computePreferences = async () => {
    setComputing(true);
    toast({
      title: "Coming Soon",
      description: "Style analytics are being enhanced. Check back soon!",
    });
    setComputing(false);
  };

  useEffect(() => {
    // Temporarily disabled - just show the UI
    setLoading(false);
    setPreferences(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your style profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Kikonasu" className="h-10 w-10 object-contain" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Style Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={computePreferences}
              disabled={computing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${computing ? "animate-spin" : ""}`} />
              {computing ? "Updating..." : "Refresh"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wardrobe")}>
              Wardrobe
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Explainer Section */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">✨</div>
            <CardTitle className="text-3xl">Your Personal Style Intelligence</CardTitle>
            <CardDescription className="text-base mt-2">
              Kikonasu learns from your outfit choices, favorites, and planning habits to understand your unique style. 
              The more you use the app, the smarter your recommendations become.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="text-3xl">👕</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Most-Worn Items</h4>
                  <p className="text-sm text-muted-foreground">Discover your go-to pieces and wardrobe workhorses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">🎨</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Signature Colors</h4>
                  <p className="text-sm text-muted-foreground">See your personal color palette and preferences</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">📅</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Occasion Breakdown</h4>
                  <p className="text-sm text-muted-foreground">Understand where you spend your time and dress accordingly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">📈</div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Style Evolution</h4>
                  <p className="text-sm text-muted-foreground">Track how your taste and preferences change over time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!preferences || (preferences.topItems.length === 0 && preferences.occasionPreferences.length === 0) ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Build Your Style Profile</h2>
            <p className="text-muted-foreground mb-6">
              Start creating outfits, saving favorites, and planning trips to unlock personalized insights. 
              Your AI stylist gets smarter with every choice you make!
            </p>
            <Button onClick={() => navigate("/todays-look")} size="lg">
              Generate Your First Outfit
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Most Worn
                  </CardTitle>
                  <CardDescription>Items you love</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{preferences.topItems.length}</div>
                  <p className="text-sm text-muted-foreground">favorite items</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Occasions
                  </CardTitle>
                  <CardDescription>Your lifestyle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{preferences.occasionPreferences.length}</div>
                  <p className="text-sm text-muted-foreground">occasion types</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Style Score
                  </CardTitle>
                  <CardDescription>AI personalization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.min(100, preferences.topItems.reduce((acc, item) => acc + item.count, 0))}%
                  </div>
                  <p className="text-sm text-muted-foreground">personalized</p>
                </CardContent>
              </Card>
            </div>

            {/* Most Worn Items */}
            {preferences.topItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Most-Worn Items</CardTitle>
                  <CardDescription>The pieces you reach for most often</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {preferences.topItems.map((usage) => (
                      <div key={usage.itemId} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20">
                          <img
                            src={usage.item.signedUrl || usage.item.image_url}
                            alt={usage.item.category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
                          {usage.count}x
                        </div>
                        <p className="text-sm text-center mt-2 text-muted-foreground">{usage.item.category}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Occasion Preferences */}
            {preferences.occasionPreferences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Occasions</CardTitle>
                  <CardDescription>How you use your wardrobe</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {preferences.occasionPreferences.map((pref) => (
                      <Badge key={pref.occasion} variant="secondary" className="text-base py-2 px-4">
                        {pref.occasion} ({pref.count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>How we personalize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold">Smart Suggestions</h4>
                    <p className="text-sm text-muted-foreground">
                      We prioritize items you wear most often when generating outfits
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🧠</div>
                  <div>
                    <h4 className="font-semibold">Learning Your Style</h4>
                    <p className="text-sm text-muted-foreground">
                      Every favorite and outfit choice helps us understand your preferences better
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h4 className="font-semibold">Personalized Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      Your style profile gets smarter with every interaction
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default StyleProfile;
