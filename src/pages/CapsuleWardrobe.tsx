import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, Save, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSignedUrl } from "@/lib/storageUtils";
import { 
  calculateOutfits, 
  calculateCategoryBreakdown, 
  suggestGaps,
  getCategoryEmoji 
} from "@/lib/capsuleCalculations";
import { CapsuleTemplateBrowser } from "@/components/CapsuleTemplateBrowser";
import { CapsuleTemplateDetail } from "@/components/CapsuleTemplateDetail";
import { EditCapsuleDialog } from "@/components/EditCapsuleDialog";
import { capsuleTemplates, matchCapsuleTemplate, CapsuleTemplate } from "@/lib/capsuleTemplates";
import logoImage from "@/assets/kikonasu-logo-optimized.webp";

interface WardrobeItem {
  id: string;
  image_url: string;
  category: string;
  signedUrl?: string;
}

interface SavedCapsule {
  id: string;
  name: string;
  item_ids: string[];
  total_outfits: number;
  created_at: string;
}

interface GeneratedOutfit {
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  shoes?: WardrobeItem;
  dress?: WardrobeItem;
  outerwear?: WardrobeItem;
  accessory?: WardrobeItem;
}

const CapsuleWardrobe = () => {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [savedCapsules, setSavedCapsules] = useState<SavedCapsule[]>([]);
  const [capsuleName, setCapsuleName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CapsuleTemplate | null>(null);
  const [activeView, setActiveView] = useState<'build' | 'templates'>('templates');
  const [manualMatches, setManualMatches] = useState<Record<string, any>>({});
  const [showOutfits, setShowOutfits] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>([]);
  const [editingCapsule, setEditingCapsule] = useState<SavedCapsule | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedTemplate]); // Re-fetch when template changes to load manual matches

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch wardrobe items
      const { data: items, error: itemsError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      const itemsWithUrls = await Promise.all(
        (items || []).map(async (item) => ({
          ...item,
          signedUrl: await getSignedUrl(item.image_url)
        }))
      );

      setWardrobeItems(itemsWithUrls);

      // Fetch saved capsules
      const { data: capsules, error: capsulesError } = await supabase
        .from("capsule_wardrobes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (capsulesError) throw capsulesError;
      setSavedCapsules(capsules || []);

      // Fetch manual capsule matches if a template is selected
      if (selectedTemplate) {
        const { data: matches, error: matchesError } = await supabase
          .from("user_capsule_items")
          .select(`
            template_item_id,
            wardrobe_item_id
          `)
          .eq("user_id", user.id)
          .eq("template_id", selectedTemplate.id);

        if (matchesError) {
          console.error("Error loading manual matches:", matchesError);
        } else if (matches) {
          // Build a map of template_item_id -> wardrobe item
          const matchesMap: Record<string, any> = {};
          for (const match of matches) {
            const wardrobeItem = itemsWithUrls.find(i => i.id === match.wardrobe_item_id);
            if (wardrobeItem) {
              matchesMap[match.template_item_id] = wardrobeItem;
            }
          }
          console.log("✅ Loaded manual matches:", matchesMap);
          setManualMatches(matchesMap);
        }

        // Auto-generate AI images for emoji placeholders
        generateMissingImages(selectedTemplate, user.id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load wardrobe items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryPlaceholder = (category: string): string => {
    const placeholderMap: Record<string, string> = {
      Top: "/templates/items/navy-blazer.jpg",
      Bottom: "/templates/items/navy-dress-pants.jpg",
      Shoes: "/templates/items/white-sneakers.jpg",
      Dress: "/templates/items/navy-blazer.jpg",
      Outerwear: "/templates/items/navy-hooded-jacket.jpg",
      Accessory: "/templates/items/brown-loafers.jpg",
    };
    return placeholderMap[category] || "/templates/items/navy-blazer.jpg";
  };

  const generateMissingImages = async (template: CapsuleTemplate, userId: string) => {
    // Find items with emoji placeholders (not starting with /)
    const itemsNeedingImages = template.items.filter(item => 
      item.placeholder_image && !item.placeholder_image.startsWith('/')
    );

    if (itemsNeedingImages.length === 0) return;

    console.log(`🎨 Using placeholder images for ${itemsNeedingImages.length} template items...`);

    // Use placeholder images based on category instead of AI generation
    for (const item of itemsNeedingImages) {
      item.placeholder_image = getCategoryPlaceholder(item.category);
      console.log(`✅ Using placeholder for ${item.description}: ${item.placeholder_image}`);
    }

    setSelectedTemplate({...template});
    console.log('✅ All placeholder images applied!');
  };

  const toggleItemSelection = (item: WardrobeItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(i => i.id === item.id);
      if (isSelected) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const saveCapsule = async () => {
    if (!capsuleName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your capsule",
        variant: "destructive"
      });
      return;
    }

    if (selectedItems.length < 10) {
      toast({
        title: "Not enough items",
        description: "Select at least 10 items for your capsule",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalOutfits = calculateOutfits(selectedItems);

      const { error } = await supabase
        .from("capsule_wardrobes")
        .insert({
          user_id: user.id,
          name: capsuleName,
          item_ids: selectedItems.map(i => i.id),
          total_outfits: totalOutfits
        });

      if (error) throw error;

      toast({
        title: "Capsule saved! 🎉",
        description: `"${capsuleName}" creates ${totalOutfits} outfits from ${selectedItems.length} items`
      });

      setCapsuleName("");
      setShowSaveDialog(false);
      fetchData();
    } catch (error) {
      console.error("Error saving capsule:", error);
      toast({
        title: "Error",
        description: "Failed to save capsule",
        variant: "destructive"
      });
    }
  };

  const loadCapsule = async (capsule: SavedCapsule) => {
    const items = wardrobeItems.filter(item => 
      capsule.item_ids.includes(item.id)
    );
    setSelectedItems(items);
    generateOutfitsFromItems(items);
    toast({
      title: "Capsule loaded ✨",
      description: `"${capsule.name}" - ${items.length} items creating ${capsule.total_outfits} outfits`
    });
  };

  const generateOutfitsFromItems = (items: WardrobeItem[]) => {
    const outfits: GeneratedOutfit[] = [];
    
    // Categorize items
    const tops = items.filter(i => i.category === "Top");
    const bottoms = items.filter(i => i.category === "Bottom");
    const shoes = items.filter(i => i.category === "Shoes");
    const dresses = items.filter(i => i.category === "Dress");
    const outerwear = items.filter(i => i.category === "Outerwear");
    const accessories = items.filter(i => i.category === "Accessory");

    // Generate outfits: dress-based OR top+bottom combinations
    if (dresses.length > 0) {
      // Dress-based outfits
      dresses.forEach(dress => {
        shoes.forEach(shoe => {
          outfits.push({ dress, shoes: shoe });
          
          // Add variations with outerwear
          outerwear.forEach(outer => {
            outfits.push({ dress, shoes: shoe, outerwear: outer });
          });
          
          // Add variations with accessories
          accessories.forEach(acc => {
            outfits.push({ dress, shoes: shoe, accessory: acc });
          });
        });
      });
    }

    // Top + Bottom combinations
    tops.forEach(top => {
      bottoms.forEach(bottom => {
        shoes.forEach(shoe => {
          outfits.push({ top, bottom, shoes: shoe });
          
          // Add variations with outerwear
          outerwear.forEach(outer => {
            outfits.push({ top, bottom, shoes: shoe, outerwear: outer });
          });
          
          // Add variations with accessories
          accessories.forEach(acc => {
            outfits.push({ top, bottom, shoes: shoe, accessory: acc });
          });
        });
      });
    });

    // Limit to first 50 outfits for performance
    setGeneratedOutfits(outfits.slice(0, 50));
    setShowOutfits(true);
  };

  const viewOutfits = () => {
    if (selectedItems.length >= 10) {
      generateOutfitsFromItems(selectedItems);
    } else {
      toast({
        title: "Not enough items",
        description: "Select at least 10 items to view outfits",
        variant: "destructive"
      });
    }
  };

  const deleteCapsule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("capsule_wardrobes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Clear all related state
      setSelectedItems([]);
      setShowOutfits(false);
      setGeneratedOutfits([]);
      setCapsuleName("");

      toast({
        title: "Capsule deleted",
        description: "Your capsule has been removed"
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting capsule:", error);
      toast({
        title: "Error",
        description: "Failed to delete capsule",
        variant: "destructive"
      });
    }
  };

  const handleEditCapsule = (capsule: SavedCapsule) => {
    setEditingCapsule(capsule);
    setShowEditDialog(true);
  };

  const handleSaveEditedCapsule = async (capsuleId: string, newItemIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const items = wardrobeItems.filter(item => newItemIds.includes(item.id));
      const totalOutfits = calculateOutfits(items);

      const { error } = await supabase
        .from("capsule_wardrobes")
        .update({
          item_ids: newItemIds,
          total_outfits: totalOutfits,
          updated_at: new Date().toISOString()
        })
        .eq("id", capsuleId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error("Error updating capsule:", error);
      throw error;
    }
  };

  const totalOutfits = calculateOutfits(selectedItems);
  const breakdown = calculateCategoryBreakdown(selectedItems);
  const suggestions = selectedItems.length >= 10 ? suggestGaps(selectedItems, wardrobeItems) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const getCelebrationMessage = (outfits: number) => {
    if (outfits < 30) return { emoji: "🎯", text: "Nice start!" };
    if (outfits < 50) return { emoji: "🌟", text: "Excellent versatility!" };
    if (outfits < 75) return { emoji: "🔥", text: "Capsule goals!" };
    return { emoji: "👑", text: "Ultimate minimalist!" };
  };

  const celebration = getCelebrationMessage(totalOutfits);

  const handleSelectTemplate = (template: CapsuleTemplate) => {
    setSelectedTemplate(template);
  };

  const handleBackFromTemplate = () => {
    setSelectedTemplate(null);
  };

  const handleSaveTemplateProgress = () => {
    toast({
      title: "Progress saved! ✨",
      description: "Your template progress has been saved"
    });
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectedTemplate ? handleBackFromTemplate() : navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button onClick={() => navigate("/")} className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Kikonasu" className="h-8" />
            </button>
            <h1 className="text-xl font-bold text-foreground">
              {selectedTemplate ? selectedTemplate.name : "Capsule Wardrobe"}
            </h1>
          </div>
          {activeView === 'build' && !selectedTemplate && (
            <Badge variant="outline" className="text-base px-4 py-2">
              {selectedItems.length} / 10-15 items
            </Badge>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Template Detail View */}
        {selectedTemplate ? (
          <CapsuleTemplateDetail
            template={selectedTemplate}
            match={matchCapsuleTemplate(wardrobeItems, selectedTemplate, manualMatches)}
            onBack={handleBackFromTemplate}
            onSaveProgress={handleSaveTemplateProgress}
            userWardrobe={wardrobeItems}
            onMatchUpdate={fetchData}
            manualMatches={manualMatches}
          />
        ) : (
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'build' | 'templates')} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="templates">Browse Templates</TabsTrigger>
              <TabsTrigger value="build">Build Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              <CapsuleTemplateBrowser
                templates={capsuleTemplates}
                userWardrobe={wardrobeItems}
                onSelectTemplate={handleSelectTemplate}
              />
            </TabsContent>

            <TabsContent value="build" className="space-y-6">
              {/* Educational Hero Section */}
              {selectedItems.length === 0 && (
          <Card className="border-2">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-foreground">Build a Capsule Wardrobe</h2>
                <p className="text-xl text-muted-foreground">
                  Select 10-15 versatile pieces and discover how many outfits you can create
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">What is a Capsule Wardrobe?</h3>
                  <p className="text-muted-foreground">
                    A curated collection of essential clothing items that work together seamlessly. 
                    Every piece coordinates with the others, giving you maximum outfit combinations from minimum items.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Why Build One?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center text-center p-4 bg-secondary/10 rounded-lg border border-border hover:shadow-md transition-shadow">
                      <span className="text-4xl mb-3">✈️</span>
                      <h4 className="font-bold text-foreground mb-2">Travel lighter</h4>
                      <p className="text-sm text-muted-foreground">Pack less, wear more</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-secondary/10 rounded-lg border border-border hover:shadow-md transition-shadow">
                      <span className="text-4xl mb-3">💰</span>
                      <h4 className="font-bold text-foreground mb-2">Shop smarter</h4>
                      <p className="text-sm text-muted-foreground">Identify what you need</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-secondary/10 rounded-lg border border-border hover:shadow-md transition-shadow">
                      <span className="text-4xl mb-3">⏰</span>
                      <h4 className="font-bold text-foreground mb-2">Save time</h4>
                      <p className="text-sm text-muted-foreground">Every item works together</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 bg-secondary/10 rounded-lg border border-border hover:shadow-md transition-shadow">
                      <span className="text-4xl mb-3">♻️</span>
                      <h4 className="font-bold text-foreground mb-2">Reduce waste</h4>
                      <p className="text-sm text-muted-foreground">Buy only versatile pieces</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">How It Works:</h3>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">1️⃣</div>
                    <p className="text-sm text-muted-foreground">Select 10-15 items</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl">2️⃣</div>
                    <p className="text-sm text-muted-foreground">Calculate combinations</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl">3️⃣</div>
                    <p className="text-sm text-muted-foreground">Find missing pieces</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl">4️⃣</div>
                    <p className="text-sm text-muted-foreground">View all outfits</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selection Progress */}
        {selectedItems.length > 0 && selectedItems.length < 10 && (
          <Card className="border-primary/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Selection Summary</h3>
                <Badge variant="secondary">{selectedItems.length}/10 minimum</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { category: 'Tops', emoji: '👕', target: '3-5' },
                  { category: 'Bottoms', emoji: '👖', target: '2-4' },
                  { category: 'Shoes', emoji: '👟', target: '3-4' },
                  { category: 'Outerwear', emoji: '🧥', target: '1-2' }
                ].map(({ category, emoji, target }) => {
                  const count = breakdown.find(b => b.category === category)?.count || 0;
                  return (
                    <div key={category} className="text-center space-y-1">
                      <div className="text-2xl">{emoji}</div>
                      <div className="text-lg font-bold text-foreground">{count}</div>
                      <div className="text-xs text-muted-foreground">{category}</div>
                      <div className="text-xs text-muted-foreground">Aim: {target}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                💡 Tip: Mix neutrals with 1-2 accent colors for versatility
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {selectedItems.length >= 10 && (
          <Card className="border-2 border-primary">
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-2">{celebration.emoji}</div>
                <p className="text-lg text-muted-foreground">Your Capsule Creates</p>
                <h3 className="text-7xl font-bold text-primary">{totalOutfits}</h3>
                <p className="text-2xl text-foreground font-semibold">OUTFITS</p>
                <p className="text-lg text-muted-foreground">From just {selectedItems.length} pieces! {celebration.text}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-border">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Your Capsule Contains:</h4>
                  <div className="space-y-2">
                    {breakdown.map(({ category, count }) => (
                      <div key={category} className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryEmoji(category)}</span>
                        <span className="text-foreground">{count} {category}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground pt-2 border-t border-border">
                    = {totalOutfits} unique outfit combinations
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Perfect for:</h4>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>2-week business trip</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Beach vacation wardrobe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Minimalist daily rotation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Weekend getaway packing</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1"
                  size="lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save This Capsule
                </Button>
                <Button
                  variant="outline"
                  onClick={viewOutfits}
                  className="flex-1"
                  size="lg"
                >
                  👀 View All {totalOutfits} Outfits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gap Analysis */}
        {suggestions.length > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Want Even More Outfits?
                </h3>
                <p className="text-muted-foreground">
                  Adding just one strategic piece could unlock dozens of new combinations
                </p>
              </div>
              <div className="space-y-3">
                {suggestions.map(({ item, outfitIncrease, newTotal }) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.signedUrl || item.image_url}
                        alt={item.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-foreground text-lg">
                        Add 1 {item.category.toUpperCase()}
                      </p>
                      <p className="text-xl font-bold text-primary">
                        → {newTotal} outfits <span className="text-sm text-muted-foreground">(+{outfitIncrease} outfits!)</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This {item.category.toLowerCase()} works with all your existing pieces
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => toggleItemSelection(item)}
                    >
                      Add Item
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Capsules */}
        {savedCapsules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Your Saved Capsules</h3>
              <Badge variant="secondary">{savedCapsules.length} saved</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedCapsules.map(capsule => (
                <Card key={capsule.id} className="cursor-pointer hover:border-primary transition-colors group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg mb-1">{capsule.name}</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            📦 {capsule.item_ids.length} items
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {capsule.total_outfits} outfits
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => loadCapsule(capsule)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCapsule(capsule)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCapsule(capsule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Item Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              {selectedItems.length === 0 ? 'Select Your Items' : 'Your Selection'}
            </h3>
            {selectedItems.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setSelectedItems([])}
                size="sm"
              >
                Clear All
              </Button>
            )}
          </div>
          {wardrobeItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <div className="text-5xl mb-4">👗</div>
                <h4 className="text-xl font-semibold text-foreground">No wardrobe items yet</h4>
                <p className="text-muted-foreground">Add items to your wardrobe first to build a capsule</p>
                <Button onClick={() => navigate("/")}>
                  Go to Wardrobe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wardrobeItems.map(item => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              return (
                <Card
                  key={item.id}
                  onClick={() => toggleItemSelection(item)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:ring-2 hover:ring-primary/50'
                  }`}
                >
                  <CardContent className="p-0 relative">
                    <div className="aspect-square rounded-t-lg overflow-hidden bg-secondary/20">
                      <img
                        src={item.signedUrl || item.image_url}
                        alt={item.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="p-2 text-center">
                      <p className="text-xs font-medium text-foreground">{item.category}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Outfits Display Modal */}
        {showOutfits && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-6xl my-8">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Generated Outfits</h3>
                    <p className="text-muted-foreground">
                      Showing {generatedOutfits.length} of {totalOutfits} possible combinations
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => setShowOutfits(false)}>
                    Close
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                  {generatedOutfits.map((outfit, index) => (
                    <Card key={index} className="p-4 space-y-3">
                      <div className="text-center font-semibold text-sm text-muted-foreground">
                        Outfit {index + 1}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {outfit.dress ? (
                          <div className="col-span-2 space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.dress.signedUrl || outfit.dress.image_url}
                                alt="Dress"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Dress</p>
                          </div>
                        ) : (
                          <>
                            {outfit.top && (
                              <div className="space-y-1">
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={outfit.top.signedUrl || outfit.top.image_url}
                                    alt="Top"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">Top</p>
                              </div>
                            )}
                            {outfit.bottom && (
                              <div className="space-y-1">
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={outfit.bottom.signedUrl || outfit.bottom.image_url}
                                    alt="Bottom"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">Bottom</p>
                              </div>
                            )}
                          </>
                        )}
                        {outfit.shoes && (
                          <div className="space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.shoes.signedUrl || outfit.shoes.image_url}
                                alt="Shoes"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Shoes</p>
                          </div>
                        )}
                        {outfit.outerwear && (
                          <div className="space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.outerwear.signedUrl || outfit.outerwear.image_url}
                                alt="Outerwear"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Jacket</p>
                          </div>
                        )}
                        {outfit.accessory && (
                          <div className="space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.accessory.signedUrl || outfit.accessory.image_url}
                                alt="Accessory"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Accessory</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Outfits Display Modal */}
        {showOutfits && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-6xl my-8">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Generated Outfits</h3>
                    <p className="text-muted-foreground">
                      Showing {generatedOutfits.length} of {totalOutfits} possible combinations
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => setShowOutfits(false)}>
                    Close
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                  {generatedOutfits.map((outfit, index) => (
                    <Card key={index} className="p-4 space-y-3">
                      <div className="text-center font-semibold text-sm text-muted-foreground">
                        Outfit {index + 1}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {outfit.dress ? (
                          <div className="col-span-2 space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.dress.signedUrl || outfit.dress.image_url}
                                alt="Dress"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Dress</p>
                          </div>
                        ) : (
                          <>
                            {outfit.top && (
                              <div className="space-y-1">
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={outfit.top.signedUrl || outfit.top.image_url}
                                    alt="Top"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">Top</p>
                              </div>
                            )}
                            {outfit.bottom && (
                              <div className="space-y-1">
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={outfit.bottom.signedUrl || outfit.bottom.image_url}
                                    alt="Bottom"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">Bottom</p>
                              </div>
                            )}
                          </>
                        )}
                        {outfit.shoes && (
                          <div className="space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.shoes.signedUrl || outfit.shoes.image_url}
                                alt="Shoes"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Shoes</p>
                          </div>
                        )}
                        {outfit.outerwear && (
                          <div className="space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.outerwear.signedUrl || outfit.outerwear.image_url}
                                alt="Outerwear"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Jacket</p>
                          </div>
                        )}
                        {outfit.accessory && (
                          <div className="space-y-1">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={outfit.accessory.signedUrl || outfit.accessory.image_url}
                                alt="Accessory"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">Accessory</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Capsule Dialog */}
        <EditCapsuleDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          capsule={editingCapsule}
          allWardrobeItems={wardrobeItems}
          onSave={handleSaveEditedCapsule}
        />

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl mb-2">💾</div>
                  <h3 className="text-2xl font-bold text-foreground">Save Your Capsule</h3>
                  <p className="text-muted-foreground">Give your capsule a memorable name</p>
                </div>
                <Input
                  placeholder="e.g., Winter Work Capsule, Beach Vacation"
                  value={capsuleName}
                  onChange={(e) => setCapsuleName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={saveCapsule} className="flex-1" size="lg">
                    Save Capsule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setCapsuleName("");
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapsuleWardrobe;
