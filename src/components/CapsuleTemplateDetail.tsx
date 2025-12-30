import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Package, ShoppingCart, Plus, Upload, Heart, Check, X, RefreshCw } from "lucide-react";
import { CapsuleTemplate, MatchResult, calculateCompletionPercentage, calculateBudget, CapsuleTemplateItem } from "@/lib/capsuleTemplates";
import { useState, useMemo } from "react";
import { SelectWardrobeItemDialog } from "./SelectWardrobeItemDialog";
import { AddToWishlistDialog } from "./AddToWishlistDialog";
import { AddClothesDialog } from "./AddClothesDialog";
import { getSmartPlaceholder } from "@/components/WardrobeItemImage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CapsuleTemplateDetailProps {
  template: CapsuleTemplate;
  match: MatchResult;
  onBack: () => void;
  onSaveProgress: () => void;
  userWardrobe: any[];
  onMatchUpdate?: () => void;
  manualMatches?: Record<string, any>;
}

type FilterType = "all" | "owned" | "missing" | "similar";

export const CapsuleTemplateDetail = ({ template, match, onBack, onSaveProgress, userWardrobe, onMatchUpdate, manualMatches }: CapsuleTemplateDetailProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectItemDialogOpen, setSelectItemDialogOpen] = useState(false);
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<CapsuleTemplateItem | null>(null);
  const [addClothesDialogOpen, setAddClothesDialogOpen] = useState(false);
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const completionPercentage = calculateCompletionPercentage(match, template);
  const ownedCount = match.exact.length + match.similar.length;
  const budget = calculateBudget(match.missing);
  const costPerOutfit = (budget / template.total_outfits).toFixed(2);

  // Combine all items with their status
  type ItemWithStatus = {
    item: CapsuleTemplateItem;
    status: "owned" | "missing" | "similar";
    userItem?: any;
    reason?: string;
  };

  const allItems = useMemo(() => {
    const items: ItemWithStatus[] = [];
    
    match.exact.forEach(({ templateItem, userItem }) => {
      items.push({ item: templateItem, status: "owned", userItem });
    });
    
    match.similar.forEach(({ templateItem, userItem, reason }) => {
      items.push({ item: templateItem, status: "similar", userItem, reason });
    });
    
    match.missing.forEach((item) => {
      items.push({ item, status: "missing" });
    });
    
    return items;
  }, [match]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, ItemWithStatus[]>();
    
    allItems.forEach((itemWithStatus) => {
      const category = itemWithStatus.item.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(itemWithStatus);
    });
    
    return grouped;
  }, [allItems]);

  // Filter items based on active filter
  const filteredItemsByCategory = useMemo(() => {
    if (activeFilter === "all") return itemsByCategory;
    
    const filtered = new Map<string, ItemWithStatus[]>();
    itemsByCategory.forEach((items, category) => {
      const filteredItems = items.filter(item => item.status === activeFilter);
      if (filteredItems.length > 0) {
        filtered.set(category, filteredItems);
      }
    });
    
    return filtered;
  }, [itemsByCategory, activeFilter]);

  const filterCounts = {
    all: template.total_items,
    owned: match.exact.length,
    missing: match.missing.length,
    similar: match.similar.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">{template.name}</h1>
            <p className="text-muted-foreground">{template.description}</p>
            
            {/* Color Palette */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Colors:</span>
              <div className="flex items-center gap-1.5">
                {template.colorPalette.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{
                      backgroundColor: color.toLowerCase() === 'white' ? '#fff' :
                                     color.toLowerCase() === 'black' ? '#000' :
                                     color.toLowerCase() === 'grey' || color.toLowerCase() === 'gray' ? '#8b8b8b' :
                                     color.toLowerCase() === 'navy' ? '#1e3a8a' :
                                     color.toLowerCase() === 'beige' ? '#d4c5b9' :
                                     color.toLowerCase() === 'khaki' ? '#c3b091' :
                                     color.toLowerCase() === 'charcoal' ? '#36454f' :
                                     color.toLowerCase() === 'burgundy' ? '#800020' :
                                     color.toLowerCase() === 'olive' ? '#808000' :
                                     color.toLowerCase() === 'light blue' ? '#add8e6' :
                                     '#ccc'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">{template.season}</Badge>
              <Badge variant="secondary">{template.style}</Badge>
              <span className="text-muted-foreground">{template.total_items} items = {template.total_outfits} outfits</span>
            </div>
          </div>

          <div className="aspect-square w-32 bg-secondary/20 rounded-lg flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        {/* Progress Section */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Your Progress</h3>
              <p className="text-sm text-muted-foreground">
                {ownedCount}/{template.total_items} items owned
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{completionPercentage}%</div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-3" />

          {match.missing.length > 0 && (
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Complete this capsule for <span className="font-semibold text-foreground">${budget}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ${costPerOutfit} per outfit
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 {completionPercentage === 100 ? "Capsule complete! 🎉" : `Just ${match.missing.length} more items to unlock ${template.total_outfits} outfits`}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("all")}
        >
          All Items ({filterCounts.all})
        </Button>
        <Button
          variant={activeFilter === "owned" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("owned")}
        >
          ✅ Items I Own ({filterCounts.owned})
        </Button>
        <Button
          variant={activeFilter === "missing" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("missing")}
        >
          ❌ Missing ({filterCounts.missing})
        </Button>
        <Button
          variant={activeFilter === "similar" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("similar")}
        >
          🔶 Similar ({filterCounts.similar})
        </Button>
      </div>

      {/* Visual Grid */}
      <div className="space-y-8">
        {Array.from(filteredItemsByCategory.entries()).map(([category, items]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-bold uppercase text-foreground tracking-wide">
                {category} ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h3>
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {items.map((itemWithStatus) => (
                <ItemGridTile
                  key={itemWithStatus.item.id}
                  item={itemWithStatus.item}
                  userItem={itemWithStatus.userItem}
                  status={itemWithStatus.status}
                  reason={itemWithStatus.reason}
                  onIHaveThis={() => {
                    setSelectedTemplateItem(itemWithStatus.item);
                    setSelectItemDialogOpen(true);
                  }}
                  onUploadItem={() => {
                    setSelectedTemplateItem(itemWithStatus.item);
                    setAddClothesDialogOpen(true);
                  }}
                  onAddToWishlist={() => {
                    setSelectedTemplateItem(itemWithStatus.item);
                    setWishlistDialogOpen(true);
                  }}
                  onWrongItem={() => {
                    setSelectedTemplateItem(itemWithStatus.item);
                    setSelectItemDialogOpen(true);
                  }}
                  onRemoveFromCapsule={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    const { error } = await supabase
                      .from("user_capsule_items")
                      .delete()
                      .eq("user_id", user.id)
                      .eq("template_id", template.id)
                      .eq("template_item_id", itemWithStatus.item.id);
                    
                    if (!error) {
                      toast.success("Removed from capsule");
                      onMatchUpdate?.();
                    }
                  }}
                  templateId={template.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Shopping List Summary */}
      {match.missing.length > 0 && (
        <Card className="p-4 bg-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Shopping List: {match.missing.length} items
              </span>
              <span className="text-sm text-muted-foreground">
                Total: ${budget}
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                View List
              </Button>
              <Button size="sm" variant="outline">
                Export
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button onClick={onSaveProgress} className="w-full sm:flex-1">
          💾 Save Progress
        </Button>
        {match.missing.length > 0 && (
          <Button variant="outline" className="w-full sm:flex-1">
            🛒 Add All Missing to Shopping List
          </Button>
        )}
      </div>

      {/* Dialogs */}
      {selectedTemplateItem && (
        <>
          <SelectWardrobeItemDialog
            open={selectItemDialogOpen}
            onOpenChange={setSelectItemDialogOpen}
            category={selectedTemplateItem.category}
            wardrobeItems={userWardrobe}
            templateItem={selectedTemplateItem}
            onUseStockImage={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                toast.error("Please log in to add items");
                return;
              }

              try {
                // Import the smart placeholder function
                const { getSmartPlaceholder } = await import("@/components/WardrobeItemImage");
                const placeholderImage = getSmartPlaceholder(selectedTemplateItem.category, selectedTemplateItem.description);
                console.log('📸 Using smart placeholder for', selectedTemplateItem.description, ':', placeholderImage);
                toast.info('Adding item with placeholder image...');

                // Create a wardrobe item with the placeholder image
                const { data: newItem, error: itemError } = await supabase
                  .from("wardrobe_items")
                  .insert({
                    user_id: user.id,
                    category: selectedTemplateItem.category,
                    image_url: placeholderImage,
                    ai_analysis: JSON.stringify({
                      description: selectedTemplateItem.description,
                      category: selectedTemplateItem.category,
                      color: selectedTemplateItem.color
                    })
                  })
                  .select()
                  .single();

                if (itemError || !newItem) {
                  console.error("❌ Error creating wardrobe item:", itemError);
                  toast.error("Failed to add item");
                  return;
                }

                console.log('✅ Wardrobe item created:', newItem.id);

                // Now link it to the capsule
                const { error: linkError } = await supabase
                  .from("user_capsule_items")
                  .upsert({
                    user_id: user.id,
                    template_id: template.id,
                    template_item_id: selectedTemplateItem.id,
                    wardrobe_item_id: newItem.id,
                    match_type: "manual",
                  });

                if (linkError) {
                  console.error("❌ Error linking to capsule:", linkError);
                  toast.error("Failed to link item to capsule");
                  return;
                }

                toast.success("Item added to wardrobe & capsule!");
                setSelectItemDialogOpen(false);
                onMatchUpdate?.();
              } catch (error) {
                console.error('❌ Error adding item:', error);
                toast.error('Failed to add item: ' + (error instanceof Error ? error.message : 'Unknown error'));
                
                // Fallback to placeholder image
                const { data: newItem, error: itemError } = await supabase
                  .from("wardrobe_items")
                  .insert({
                    user_id: user.id,
                    category: selectedTemplateItem.category,
                    image_url: selectedTemplateItem.placeholder_image || '',
                    ai_analysis: JSON.stringify({
                      description: selectedTemplateItem.description,
                      category: selectedTemplateItem.category,
                      color: selectedTemplateItem.color
                    })
                  })
                  .select()
                  .single();

                if (!itemError && newItem) {
                  await supabase
                    .from("user_capsule_items")
                    .upsert({
                      user_id: user.id,
                      template_id: template.id,
                      template_item_id: selectedTemplateItem.id,
                      wardrobe_item_id: newItem.id,
                      match_type: "manual",
                    });
                  
                  toast.success("Placeholder image added to wardrobe & capsule");
                  setSelectItemDialogOpen(false);
                  onMatchUpdate?.();
                }
              }
            }}
            onSelect={async (item) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                toast.error("Please log in to add items");
                return;
              }

              console.log("📝 Adding item to capsule:", {
                user_id: user.id,
                template_id: template.id,
                template_item_id: selectedTemplateItem.id,
                wardrobe_item_id: item.id,
              });

              const { data, error } = await supabase
                .from("user_capsule_items")
                .upsert({
                  user_id: user.id,
                  template_id: template.id,
                  template_item_id: selectedTemplateItem.id,
                  wardrobe_item_id: item.id,
                  match_type: "manual",
                });

              if (error) {
                console.error("❌ Error adding item to capsule:", error);
                toast.error(`Failed to add item: ${error.message}`);
                return;
              }

              console.log("✅ Item added successfully:", data);
              toast.success(`Updated to use your item ✓`);
              setSelectItemDialogOpen(false);
              onMatchUpdate?.();
            }}
          />

          <AddClothesDialog
            open={addClothesDialogOpen}
            onOpenChange={setAddClothesDialogOpen}
            onItemAdded={async (newItemId) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              await supabase
                .from("user_capsule_items")
                .insert({
                  user_id: user.id,
                  template_id: template.id,
                  template_item_id: selectedTemplateItem.id,
                  wardrobe_item_id: newItemId,
                  match_type: "uploaded",
                });

              toast.success("Item uploaded and added to capsule! ✓");
              onMatchUpdate?.();
            }}
            prefilledCategory={selectedTemplateItem.category}
          />

          <AddToWishlistDialog
            open={wishlistDialogOpen}
            onOpenChange={setWishlistDialogOpen}
            templateId={template.id}
            templateItem={selectedTemplateItem}
            onSuccess={() => {
              toast.success("Added to wishlist! ❤️");
            }}
          />
        </>
      )}
    </div>
  );
};

interface ItemGridTileProps {
  item: CapsuleTemplateItem;
  userItem?: any;
  status: "owned" | "missing" | "similar";
  reason?: string;
  onIHaveThis?: () => void;
  onUploadItem?: () => void;
  onAddToWishlist?: () => void;
  onWrongItem?: () => void;
  onRemoveFromCapsule?: () => void;
  templateId: string;
}

const ItemGridTile = ({ item, userItem, status, reason, onIHaveThis, onUploadItem, onAddToWishlist, onWrongItem, onRemoveFromCapsule, templateId }: ItemGridTileProps) => {
  const [showModal, setShowModal] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case "owned":
        return (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white hover:bg-green-600">
            ✓
          </Badge>
        );
      case "similar":
        return (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-white hover:bg-yellow-600">
            ∼
          </Badge>
        );
      case "missing":
        return (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600">
            ✕
          </Badge>
        );
    }
  };

  const getBorderClass = () => {
    switch (status) {
      case "owned":
        return "border-green-500";
      case "similar":
        return "border-yellow-500";
      case "missing":
        return "border-red-500";
    }
  };

  const priceRange = item.shopping_links?.length > 0
    ? `$${Math.min(...item.shopping_links.map(l => l.price))}-${Math.max(...item.shopping_links.map(l => l.price))}`
    : null;

  return (
    <>
      <Card 
        className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-2 ${getBorderClass()}`}
        onClick={() => setShowModal(true)}
      >
        {/* Status Badge */}
        {getStatusBadge()}

        {/* Image */}
        <div className="aspect-square bg-secondary/20 flex items-center justify-center overflow-hidden">
          {userItem?.signedUrl ? (
            <img 
              src={userItem.signedUrl} 
              alt={item.description} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <img 
              src={getSmartPlaceholder(item.category, item.description)} 
              alt={item.description} 
              className="w-full h-full object-cover opacity-60" 
            />
          )}
        </div>

        {/* Item Info */}
        <div className="p-3 space-y-2">
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
            {item.description}
          </h4>
          {status === "similar" && reason && (
            <p className="text-xs text-yellow-600 line-clamp-2">
              {reason}
            </p>
          )}
          {item.essential && (
            <Badge variant="secondary" className="text-xs">Essential</Badge>
          )}
          {status === "missing" && priceRange && (
            <p className="text-sm font-semibold text-foreground">
              {priceRange}
            </p>
          )}

          {/* Action Buttons - prevent event bubbling */}
          <div className="flex flex-col gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
            {status === "missing" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onIHaveThis}
                  className="w-full text-xs h-8"
                >
                  ➕ I Have This
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="w-full text-xs h-8"
                >
                  🛒 Shop
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddToWishlist}
                  className="w-full text-xs h-8"
                >
                  ❤️ Add to Wishlist
                </Button>
              </>
            )}

            {status === "similar" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { error } = await supabase
                      .from("user_capsule_items")
                      .upsert({
                        user_id: user.id,
                        template_id: templateId,
                        template_item_id: item.id,
                        wardrobe_item_id: userItem?.id,
                        match_type: 'manual'
                      });

                    if (!error) {
                      toast.success("✓ Match accepted");
                      onRemoveFromCapsule?.(); // Trigger refresh
                    }
                  }}
                  className="w-full text-xs h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  ✅ Correct
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onWrongItem}
                  className="w-full text-xs h-8"
                >
                  🔄 Different
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFromCapsule}
                  className="w-full text-xs h-8 text-red-600 hover:text-red-700"
                >
                  ❌ Wrong
                </Button>
              </>
            )}

            {status === "owned" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onWrongItem}
                  className="w-full text-xs h-8"
                >
                  🔄 Different Item
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveFromCapsule}
                  className="w-full text-xs h-8 text-red-600 hover:text-red-700"
                >
                  ❌ Remove
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Modal for item details */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.description}</DialogTitle>
            {item.essential && (
              <Badge variant="secondary" className="w-fit">Essential</Badge>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Image */}
            <div className="w-full h-64 bg-secondary/20 rounded-lg flex items-center justify-center overflow-hidden">
              {userItem?.signedUrl ? (
                <img 
                  src={userItem.signedUrl} 
                  alt={item.description} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Package className="w-24 h-24 text-muted-foreground" />
              )}
            </div>

            {/* Status-specific content */}
            {status === "owned" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    ✓
                  </div>
                  <p className="font-semibold">You own this!</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  This item is already in your wardrobe.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowModal(false);
                    onWrongItem?.();
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Choose Different Item
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowModal(false);
                    onRemoveFromCapsule?.();
                  }}>
                    <X className="w-4 h-4 mr-2" />
                    Remove from Capsule
                  </Button>
                </div>
              </div>
            )}

            {status === "similar" && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <DialogDescription className="text-sm text-foreground">
                    <span className="font-semibold">You have a similar item</span>
                    <br />
                    <br />
                    Template wants: {item.description}
                    <br />
                    {reason && `Note: ${reason}`}
                  </DialogDescription>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="flex-1" onClick={() => setShowModal(false)}>
                    <Check className="w-4 h-4 mr-2" />
                    This is Correct
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowModal(false);
                    onWrongItem?.();
                  }}>
                    <X className="w-4 h-4 mr-2" />
                    Wrong Item
                  </Button>
                  <Button variant="outline" className="col-span-2" onClick={() => {
                    setShowModal(false);
                    onWrongItem?.();
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Choose Different Item
                  </Button>
                </div>
              </div>
            )}

            {status === "missing" && (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Adds 15+ outfit variations
                  </p>
                  {priceRange && (
                    <p className="text-lg font-semibold text-foreground mt-2">
                      💰 {priceRange}
                    </p>
                  )}
                </div>

                {/* Action Buttons for Missing Items */}
                <div className="grid grid-cols-2 gap-2">
                  <Button className="flex-1" onClick={() => {
                    setShowModal(false);
                    onIHaveThis?.();
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    I Have This
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowModal(false);
                    onUploadItem?.();
                  }}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Item
                  </Button>
                  <Button variant="outline" className="col-span-2" onClick={() => {
                    setShowModal(false);
                    onAddToWishlist?.();
                  }}>
                    <Heart className="w-4 h-4 mr-2" />
                    Add to Wishlist
                  </Button>
                </div>

                {/* Shopping Options */}
                {item.shopping_links && item.shopping_links.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Shop Options</h4>
                    <div className="space-y-2">
                      {item.shopping_links.slice(0, 5).map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {link.retailer}
                              </p>
                              {link.badge && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {link.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-foreground">
                                ${link.price}
                              </span>
                              <span className="text-xs text-muted-foreground">→</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full">
                  ✓ Add to Shopping List
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
