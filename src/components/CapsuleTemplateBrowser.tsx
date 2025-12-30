import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CapsuleTemplate, matchCapsuleTemplate, calculateCompletionPercentage, recommendTemplates, analyzeWardrobeStyle } from "@/lib/capsuleTemplates";
import { Package, Shirt, Star, Filter } from "lucide-react";
import { useState, useMemo } from "react";

interface WardrobeItem {
  id: string;
  category: string;
  image_url: string;
  ai_analysis?: string | null;
  created_at?: string;
}

interface CapsuleTemplateBrowserProps {
  templates: CapsuleTemplate[];
  userWardrobe: WardrobeItem[];
  onSelectTemplate: (template: CapsuleTemplate) => void;
}

export const CapsuleTemplateBrowser = ({ templates, userWardrobe, onSelectTemplate }: CapsuleTemplateBrowserProps) => {
  const [filters, setFilters] = useState({
    categories: [] as string[],
    styleTypes: [] as string[],
    occasions: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get recommendations
  const recommendations = useMemo(() => {
    if (userWardrobe.length === 0) {
      // No wardrobe - show all templates in array order
      return templates.map((template) => ({
        template,
        score: 100,
        matchPercentage: 0
      }));
    }
    
    // Has wardrobe - use recommendation algorithm
    return recommendTemplates(userWardrobe, templates);
  }, [userWardrobe, templates]);


  const toggleFilter = (filterType: 'categories' | 'styleTypes' | 'occasions', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  const wardrobeAnalysis = useMemo(() => analyzeWardrobeStyle(userWardrobe), [userWardrobe]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Capsule Templates</h2>
        <p className="text-muted-foreground">
          Browse curated capsule wardrobes. See what you own, what you need, and shop to complete the look.
        </p>
      </div>

      {/* All Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            {userWardrobe.length > 0 ? "Recommended for You" : "All Templates"}
          </h3>
        </div>
        {userWardrobe.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Based on your current wardrobe style
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((rec) => {
            const template = rec.template;
            const matchPercentage = rec.matchPercentage;
            const match = matchCapsuleTemplate(userWardrobe, template);
            const completionPercentage = calculateCompletionPercentage(match, template);
            const ownedCount = match.exact.length + match.similar.length;

            return (
              <Card key={template.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectTemplate(template)}>
                {userWardrobe.length > 0 && matchPercentage > 60 && (
                  <Badge className="w-fit bg-primary/10 text-primary border-primary/20">Great Match</Badge>
                )}
                  
                <div className="aspect-[3/4] bg-secondary/20 rounded-lg overflow-hidden">
                  {template.preview_image_url && template.preview_image_url.startsWith('/') ? (
                    <img 
                      src={template.preview_image_url} 
                      alt={`${template.name} preview`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {template.preview_image_url || <Package className="w-16 h-16 text-muted-foreground" />}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  
                  {/* Color Palette */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {template.colorPalette.slice(0, 6).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border-2 border-border"
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
                  
                  <div className="flex flex-wrap gap-1">
                    {template.occasions.slice(0, 2).map(occasion => (
                      <Badge key={occasion} variant="secondary" className="text-xs">
                        {occasion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Shirt className="w-4 h-4" />
                    <span className="text-foreground font-medium">{template.total_items} pieces</span>
                  </div>
                  <span className="text-muted-foreground">{template.total_outfits} outfits</span>
                </div>

                {userWardrobe.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        You own {ownedCount}/{template.total_items} items
                      </span>
                      <span className="font-semibold text-foreground">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                )}

                <Button className="w-full" variant={userWardrobe.length > 0 && completionPercentage > 50 ? "default" : "outline"}>
                  {userWardrobe.length > 0 && completionPercentage === 100 ? "View Complete Capsule" : "View Details"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
