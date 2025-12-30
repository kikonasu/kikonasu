export interface ShoppingLink {
  retailer: string;
  price: number;
  url: string;
  badge?: string; // "Best Value", "Best Quality", etc.
}

export interface CapsuleTemplateItem {
  id: string;
  category: string;
  description: string;
  essential: boolean;
  color: string;
  style_tags: string[];
  reference_image?: string;
  placeholder_image?: string; // Generic product image for items not owned
  shopping_links: ShoppingLink[];
}

export interface CapsuleTemplate {
  id: string;
  name: string;
  description: string;
  preview_image_url?: string;
  total_items: number;
  total_outfits: number;
  season?: string;
  style: string;
  items: CapsuleTemplateItem[];
  preview_image?: string;
  colorPalette: string[]; // Colors used in this capsule
  categories: string[]; // e.g., ["Tops", "Bottoms", "Dresses"]
  styleType: string[]; // e.g., ["Professional", "Casual"]
  occasions: string[]; // e.g., ["Work", "Travel", "Everyday"]
  wardrobeComposition: 'pants-shirts' | 'dresses-skirts' | 'mixed' | 'athleisure';
}

export interface WardrobeAnalysis {
  categories: string[];
  stylePreferences: string[];
  predominantFit: 'tailored' | 'relaxed' | 'mixed';
  hasDresses: boolean;
  hasSkirts: boolean;
  hasSuits: boolean;
}

export interface MatchResult {
  exact: Array<{ templateItem: CapsuleTemplateItem; userItem: any }>;
  similar: Array<{ templateItem: CapsuleTemplateItem; userItem: any; reason: string }>;
  missing: CapsuleTemplateItem[];
}

// Wardrobe analysis function
export const analyzeWardrobeStyle = (userWardrobe: any[]): WardrobeAnalysis => {
  const categories = [...new Set(userWardrobe.map(item => item.category))];
  
  const hasDresses = userWardrobe.some(item => 
    item.category === 'Dress' || (item.ai_analysis || '').toLowerCase().includes('dress')
  );
  
  const hasSkirts = userWardrobe.some(item => 
    item.category === 'Skirts' || (item.ai_analysis || '').toLowerCase().includes('skirt')
  );
  
  const hasSuits = userWardrobe.some(item => 
    (item.ai_analysis || '').toLowerCase().includes('suit') || 
    (item.ai_analysis || '').toLowerCase().includes('blazer')
  );
  
  // Infer style preferences from item descriptions
  const allDescriptions = userWardrobe.map(i => (i.ai_analysis || '').toLowerCase()).join(' ');
  const stylePreferences = [];
  if (allDescriptions.includes('formal') || allDescriptions.includes('professional') || hasSuits) {
    stylePreferences.push('professional');
  }
  if (allDescriptions.includes('casual') || allDescriptions.includes('relaxed')) {
    stylePreferences.push('casual');
  }
  if (allDescriptions.includes('athletic') || allDescriptions.includes('sport')) {
    stylePreferences.push('athleisure');
  }
  
  // Determine predominant fit
  let predominantFit: 'tailored' | 'relaxed' | 'mixed' = 'mixed';
  const tailoredCount = (allDescriptions.match(/tailored|fitted|structured/g) || []).length;
  const relaxedCount = (allDescriptions.match(/relaxed|loose|oversized/g) || []).length;
  if (tailoredCount > relaxedCount * 1.5) predominantFit = 'tailored';
  else if (relaxedCount > tailoredCount * 1.5) predominantFit = 'relaxed';
  
  return {
    categories,
    stylePreferences: stylePreferences.length > 0 ? stylePreferences : ['casual'],
    predominantFit,
    hasDresses,
    hasSkirts,
    hasSuits
  };
};

// Smart recommendation engine
export const recommendTemplates = (userWardrobe: any[], templates: CapsuleTemplate[]) => {
  if (userWardrobe.length === 0) {
    return templates.map(template => ({
      template,
      score: 0,
      matchPercentage: 0
    }));
  }
  
  const analysis = analyzeWardrobeStyle(userWardrobe);
  
  return templates.map(template => {
    // Calculate compatibility score
    let score = 0;
    
    // Category overlap
    const userCategories = analysis.categories;
    const templateCategories = template.categories;
    const categoryOverlap = userCategories.filter(c => templateCategories.includes(c)).length;
    score += (categoryOverlap / templateCategories.length) * 40;
    
    // Style match
    const styleOverlap = analysis.stylePreferences.filter(s => 
      template.styleType.includes(s)
    ).length;
    score += (styleOverlap / Math.max(template.styleType.length, 1)) * 30;
    
    // Wardrobe composition match
    if (analysis.hasDresses && template.wardrobeComposition === 'dresses-skirts') score += 20;
    if (!analysis.hasDresses && template.wardrobeComposition === 'pants-shirts') score += 20;
    if (analysis.hasDresses && analysis.hasSkirts && template.wardrobeComposition === 'mixed') score += 15;
    
    // Calculate actual item match
    const match = matchCapsuleTemplate(userWardrobe, template);
    const matchPercentage = calculateCompletionPercentage(match, template);
    score += matchPercentage * 0.1;
    
    return {
      template,
      score,
      matchPercentage
    };
  }).sort((a, b) => b.score - a.score);
};

// Template data
export const capsuleTemplates: CapsuleTemplate[] = [
  {
    id: "winter-essentials",
    name: "Winter Essentials",
    description: "The perfect 19-item capsule for fall and winter. Mix and match for 40+ outfit combinations - ideal for travel or everyday wear.",
    preview_image_url: "/templates/cards/winter-essentials-card.jpg",
    total_items: 19,
    total_outfits: 40,
    season: "Fall/Winter",
    style: "Smart Casual",
    categories: ["Top", "Bottom", "Shoes", "Outerwear", "Accessories"],
    styleType: ["Smart Casual", "Travel", "Versatile"],
    occasions: ["Everyday", "Travel", "Work"],
    wardrobeComposition: "pants-shirts",
    colorPalette: ["Black", "Grey", "White", "Charcoal", "Olive", "Light Blue"],
    items: [
      {
        id: "black-tee",
        category: "Top",
        description: "Black classic t-shirt",
        color: "Black",
        essential: true,
        placeholder_image: "👕",
        style_tags: ["casual", "basic"],
        shopping_links: [
          { retailer: "Uniqlo", price: 14.90, url: "https://www.uniqlo.com/us/en/products/E422812-000", badge: "Best Value" },
          { retailer: "Everlane", price: 18.00, url: "https://www.everlane.com" }
        ]
      },
      {
        id: "striped-sweater",
        category: "Top",
        description: "Striped crew neck sweater",
        color: "Grey/White",
        essential: true,
        placeholder_image: "👕",
        style_tags: ["smart-casual", "layering"],
        shopping_links: [
          { retailer: "J.Crew", price: 79.50, url: "https://www.jcrew.com" }
        ]
      },
      {
        id: "light-blue-oxford",
        category: "Top",
        description: "Oxford shirt",
        color: "Light Blue",
        essential: true,
        placeholder_image: "👔",
        style_tags: ["smart-casual", "formal"],
        shopping_links: [
          { retailer: "Bonobos", price: 98.00, url: "https://bonobos.com" }
        ]
      },
      {
        id: "black-blazer",
        category: "Top",
        description: "Black travel blazer",
        color: "Black",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["smart-casual", "business"],
        shopping_links: [
          { retailer: "Suitsupply", price: 399.00, url: "https://suitsupply.com" }
        ]
      },
      {
        id: "charcoal-pullover",
        category: "Top",
        description: "Merino pullover",
        color: "Charcoal",
        essential: true,
        placeholder_image: "👕",
        style_tags: ["smart-casual", "layering"],
        shopping_links: [
          { retailer: "Uniqlo", price: 49.90, url: "https://www.uniqlo.com", badge: "Best Value" }
        ]
      },
      {
        id: "grey-chinos",
        category: "Bottom",
        description: "Slim fit chinos",
        color: "Grey",
        essential: true,
        placeholder_image: "👖",
        style_tags: ["smart-casual"],
        shopping_links: [
          { retailer: "Bonobos", price: 98.00, url: "https://bonobos.com" }
        ]
      },
      {
        id: "dark-jeans",
        category: "Bottom",
        description: "Slim fit dark jeans",
        color: "Dark Blue",
        essential: true,
        placeholder_image: "/templates/items/dark-jeans.jpg",
        style_tags: ["casual", "smart-casual"],
        shopping_links: [
          { retailer: "Levi's", price: 69.50, url: "https://www.levi.com" }
        ]
      },
      {
        id: "grey-wool-coat",
        category: "Outerwear",
        description: "Wool blend coat",
        color: "Grey",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["formal", "winter"],
        shopping_links: [
          { retailer: "J.Crew", price: 398.00, url: "https://www.jcrew.com" }
        ]
      },
      {
        id: "black-leather-jacket",
        category: "Outerwear",
        description: "Leather jacket",
        color: "Black",
        essential: false,
        placeholder_image: "🧥",
        style_tags: ["casual", "edgy"],
        shopping_links: [
          { retailer: "AllSaints", price: 449.00, url: "https://www.allsaints.com" }
        ]
      },
      {
        id: "olive-bomber",
        category: "Outerwear",
        description: "Bomber jacket",
        color: "Olive",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["casual", "layering"],
        shopping_links: [
          { retailer: "Alpha Industries", price: 165.00, url: "https://www.alphaindustries.com" }
        ]
      },
      {
        id: "black-chelsea-boots",
        category: "Shoes",
        description: "Chelsea boots",
        color: "Black",
        essential: true,
        placeholder_image: "/templates/items/black-chelsea-boots.jpg",
        style_tags: ["smart-casual", "versatile"],
        shopping_links: [
          { retailer: "Thursday Boots", price: 199.00, url: "https://thursdayboots.com" }
        ]
      },
      {
        id: "black-dress-shoes",
        category: "Shoes",
        description: "Pointed dress shoes",
        color: "Black",
        essential: true,
        placeholder_image: "👞",
        style_tags: ["formal", "business"],
        shopping_links: [
          { retailer: "Allen Edmonds", price: 425.00, url: "https://www.allenedmonds.com" }
        ]
      },
      {
        id: "grey-sneakers",
        category: "Shoes",
        description: "Grey sneakers",
        color: "Grey",
        essential: true,
        placeholder_image: "👟",
        style_tags: ["casual", "athletic"],
        shopping_links: [
          { retailer: "Adidas", price: 90.00, url: "https://www.adidas.com" }
        ]
      },
      {
        id: "sunglasses",
        category: "Accessories",
        description: "Sunglasses",
        color: "Black",
        essential: true,
        placeholder_image: "🕶️",
        style_tags: ["accessory"],
        shopping_links: [
          { retailer: "Ray-Ban", price: 154.00, url: "https://www.ray-ban.com" }
        ]
      },
      {
        id: "merino-scarf",
        category: "Accessories",
        description: "Merino wool scarf",
        color: "Grey",
        essential: true,
        placeholder_image: "🧣",
        style_tags: ["winter", "accessory"],
        shopping_links: [
          { retailer: "Uniqlo", price: 19.90, url: "https://www.uniqlo.com" }
        ]
      },
      {
        id: "reversible-belt",
        category: "Accessories",
        description: "Reversible belt",
        color: "Brown/Black",
        essential: true,
        placeholder_image: "👔",
        style_tags: ["accessory", "versatile"],
        shopping_links: [
          { retailer: "Nordstrom", price: 49.00, url: "https://www.nordstrom.com" }
        ]
      },
      {
        id: "day-bag",
        category: "Accessories",
        description: "Tablet day bag",
        color: "Black",
        essential: true,
        placeholder_image: "💼",
        style_tags: ["travel", "work"],
        shopping_links: [
          { retailer: "Bellroy", price: 179.00, url: "https://bellroy.com" }
        ]
      },
      {
        id: "backpack",
        category: "Accessories",
        description: "Canvas backpack",
        color: "Olive",
        essential: false,
        placeholder_image: "🎒",
        style_tags: ["travel", "casual"],
        shopping_links: [
          { retailer: "Herschel", price: 99.99, url: "https://herschel.com" }
        ]
      },
      {
        id: "luggage",
        category: "Accessories",
        description: "Spinner luggage",
        color: "Any",
        essential: false,
        placeholder_image: "🧳",
        style_tags: ["travel"],
        shopping_links: [
          { retailer: "Amazon", price: 149.99, url: "https://www.amazon.com" }
        ]
      }
    ]
  },
  {
    id: "guardian-capsule",
    name: "Timeless Essentials",
    description: "25 timeless pieces that never go out of style. Quality classics for every occasion, season after season.",
    preview_image_url: "/templates/cards/guardian-capsule-card.jpg",
    total_items: 25,
    total_outfits: 75,
    season: "All Season",
    style: "Classic",
    categories: ["Top", "Bottom", "Shoes", "Outerwear", "Accessories"],
    styleType: ["Classic", "Editorial", "Quality-Focused"],
    occasions: ["Everyday", "Work", "Formal", "Casual"],
    wardrobeComposition: "pants-shirts",
    colorPalette: ["White", "Black", "Navy", "Grey", "Blue", "Brown", "Olive"],
    items: [
      // TOPS (10 items)
      {
        id: "white-tee",
        category: "Top",
        description: "Classic white crew neck t-shirt",
        color: "White",
        essential: true,
        placeholder_image: "👕",
        style_tags: ["basic", "casual"],
        shopping_links: [
          { retailer: "Sunspel", price: 55.00, url: "https://www.sunspel.com" }
        ]
      },
      {
        id: "black-tee",
        category: "Top",
        description: "Classic black crew neck t-shirt",
        color: "Black",
        essential: true,
        placeholder_image: "👕",
        style_tags: ["basic", "casual"],
        shopping_links: [
          { retailer: "Sunspel", price: 55.00, url: "https://www.sunspel.com" }
        ]
      },
      {
        id: "white-oxford-shirt",
        category: "Top",
        description: "Classic white dress shirt - oxford or poplin",
        color: "White",
        essential: true,
        placeholder_image: "👔",
        style_tags: ["formal", "smart-casual"],
        shopping_links: [
          { retailer: "Charles Tyrwhitt", price: 89.00, url: "https://www.charlestyrwhitt.com" }
        ]
      },
      {
        id: "stripe-shirt",
        category: "Top",
        description: "Striped button-down shirt",
        color: "Blue/White",
        essential: true,
        placeholder_image: "👔",
        style_tags: ["smart-casual", "casual"],
        shopping_links: [
          { retailer: "J.Crew", price: 79.50, url: "https://www.jcrew.com" }
        ]
      },
      {
        id: "denim-shirt",
        category: "Top",
        description: "Classic chambray or denim button-down",
        color: "Blue",
        essential: true,
        placeholder_image: "👔",
        style_tags: ["casual", "versatile"],
        shopping_links: [
          { retailer: "Levi's", price: 69.50, url: "https://www.levi.com" }
        ]
      },
      {
        id: "silk-short-sleeve-shirt",
        category: "Top",
        description: "Summer short sleeve silk or linen shirt",
        color: "Neutral",
        essential: false,
        placeholder_image: "👕",
        style_tags: ["summer", "luxury"],
        shopping_links: [
          { retailer: "Reiss", price: 145.00, url: "https://www.reiss.com" }
        ]
      },
      {
        id: "knitted-polo",
        category: "Top",
        description: "Knitted long sleeve polo shirt",
        color: "Navy",
        essential: false,
        placeholder_image: "/templates/items/grey-knitted-polo.jpg",
        style_tags: ["smart-casual", "textured"],
        shopping_links: [
          { retailer: "John Smedley", price: 195.00, url: "https://www.johnsmedley.com" }
        ]
      },
      {
        id: "crew-neck-jumper",
        category: "Top",
        description: "Classic crew neck sweater",
        color: "Navy",
        essential: true,
        placeholder_image: "/templates/items/grey-crewneck.jpg",
        style_tags: ["smart-casual", "layering"],
        shopping_links: [
          { retailer: "Uniqlo", price: 49.90, url: "https://www.uniqlo.com" }
        ]
      },
      {
        id: "vneck-rollneck-jumper",
        category: "Top",
        description: "V-neck or turtleneck sweater",
        color: "Grey",
        essential: true,
        placeholder_image: "/templates/items/black-rollneck.jpg",
        style_tags: ["smart-casual", "layering"],
        shopping_links: [
          { retailer: "COS", price: 79.00, url: "https://www.cosstores.com" }
        ]
      },
      {
        id: "arty-knitwear",
        category: "Top",
        description: "Statement knit sweater with texture or pattern",
        color: "Various",
        essential: false,
        placeholder_image: "👕",
        style_tags: ["statement", "casual"],
        shopping_links: [
          { retailer: "Norse Projects", price: 189.00, url: "https://www.norseprojects.com" }
        ]
      },

      // BOTTOMS (5 items - including suit pants)
      {
        id: "chinos",
        category: "Bottom",
        description: "Classic chino pants",
        color: "Khaki",
        essential: true,
        placeholder_image: "👖",
        style_tags: ["smart-casual", "versatile"],
        shopping_links: [
          { retailer: "Bonobos", price: 98.00, url: "https://bonobos.com" }
        ]
      },
      {
        id: "tailored-trousers",
        category: "Bottom",
        description: "Dress trousers or wool pants",
        color: "Grey",
        essential: true,
        placeholder_image: "/templates/items/black-tailored-trousers.jpg",
        style_tags: ["formal", "business"],
        shopping_links: [
          { retailer: "Suitsupply", price: 139.00, url: "https://suitsupply.com" }
        ]
      },
      {
        id: "jeans",
        category: "Bottom",
        description: "Dark wash denim jeans",
        color: "Dark Blue",
        essential: true,
        placeholder_image: "/templates/items/dark-jeans.jpg",
        style_tags: ["casual", "versatile"],
        shopping_links: [
          { retailer: "Levi's", price: 98.00, url: "https://www.levi.com" }
        ]
      },
      {
        id: "shorts",
        category: "Bottom",
        description: "Chino shorts for summer",
        color: "Navy",
        essential: false,
        placeholder_image: "🩳",
        style_tags: ["summer", "casual"],
        shopping_links: [
          { retailer: "J.Crew", price: 64.50, url: "https://www.jcrew.com" }
        ]
      },
      {
        id: "suit-pants",
        category: "Bottom",
        description: "Mid weight suit trousers",
        color: "Navy/Grey",
        essential: true,
        placeholder_image: "👖",
        style_tags: ["formal", "business"],
        shopping_links: [
          { retailer: "Suitsupply", price: 139.00, url: "https://suitsupply.com" }
        ]
      },

      // OUTERWEAR (6 items)
      {
        id: "double-breasted-blazer",
        category: "Outerwear",
        description: "Navy double-breasted blazer",
        color: "Navy",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["formal", "statement"],
        shopping_links: [
          { retailer: "Suitsupply", price: 499.00, url: "https://suitsupply.com" }
        ]
      },
      {
        id: "utility-jacket",
        category: "Outerwear",
        description: "Field jacket or utility jacket",
        color: "Olive",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["casual", "versatile"],
        shopping_links: [
          { retailer: "J.Crew", price: 168.00, url: "https://www.jcrew.com" }
        ]
      },
      {
        id: "trench-overcoat",
        category: "Outerwear",
        description: "Classic trench or wool overcoat",
        color: "Beige/Grey",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["formal", "winter"],
        shopping_links: [
          { retailer: "Burberry", price: 1890.00, url: "https://www.burberry.com" },
          { retailer: "J.Crew", price: 398.00, url: "https://www.jcrew.com", badge: "Best Value" }
        ]
      },
      {
        id: "gilet",
        category: "Outerwear",
        description: "Quilted or puffer vest",
        color: "Navy",
        essential: false,
        placeholder_image: "🦺",
        style_tags: ["layering", "casual"],
        shopping_links: [
          { retailer: "Barbour", price: 129.00, url: "https://www.barbour.com" }
        ]
      },
      {
        id: "insulated-jacket",
        category: "Outerwear",
        description: "Quilted or puffer jacket",
        color: "Navy/Black",
        essential: true,
        placeholder_image: "/templates/items/insulated-jacket.jpg",
        style_tags: ["winter", "casual"],
        shopping_links: [
          { retailer: "Uniqlo", price: 69.90, url: "https://www.uniqlo.com" }
        ]
      },
      {
        id: "mid-weight-suit",
        category: "Outerwear",
        description: "Year-round suit jacket",
        color: "Navy/Grey",
        essential: true,
        placeholder_image: "🧥",
        style_tags: ["formal", "business"],
        shopping_links: [
          { retailer: "Suitsupply", price: 399.00, url: "https://suitsupply.com" }
        ]
      },

      // SHOES (3 items)
      {
        id: "white-trainers",
        category: "Shoes",
        description: "Minimal white leather sneakers",
        color: "White",
        essential: true,
        placeholder_image: "👟",
        style_tags: ["casual", "versatile"],
        shopping_links: [
          { retailer: "Common Projects", price: 425.00, url: "https://www.commonprojects.com" },
          { retailer: "Adidas", price: 90.00, url: "https://www.adidas.com", badge: "Best Value" }
        ]
      },
      {
        id: "chelsea-boots",
        category: "Shoes",
        description: "Brown or black Chelsea boots",
        color: "Brown",
        essential: true,
        placeholder_image: "/templates/items/black-chelsea-boots.jpg",
        style_tags: ["smart-casual", "versatile"],
        shopping_links: [
          { retailer: "Thursday Boots", price: 199.00, url: "https://thursdayboots.com" }
        ]
      },
      {
        id: "loafers",
        category: "Shoes",
        description: "Leather penny loafers or driving shoes",
        color: "Brown",
        essential: true,
        placeholder_image: "/templates/items/black-loafers.jpg",
        style_tags: ["smart-casual", "summer"],
        shopping_links: [
          { retailer: "G.H. Bass", price: 165.00, url: "https://www.ghbass.com" }
        ]
      },

      // ACCESSORIES (1 item)
      {
        id: "scarf",
        category: "Accessories",
        description: "Wool or cashmere scarf",
        color: "Grey/Navy",
        essential: true,
        placeholder_image: "🧣",
        style_tags: ["winter", "accessory"],
        shopping_links: [
          { retailer: "Johnstons of Elgin", price: 195.00, url: "https://www.johnstonsofelgin.com" }
        ]
      }
    ]
  },
  {
    id: "minimalist-essentials",
    name: "Minimalist Essentials",
    description: "20 neutral basics focused on pants and shirts. Maximum versatility, minimum clutter.",
    preview_image_url: "/templates/cards/minimalist-essentials-card.jpg",
    total_items: 20,
    total_outfits: 67,
    season: "All Season",
    style: "Minimalist",
    colorPalette: ["Black", "White", "Grey", "Navy", "Beige", "Khaki"],
    categories: ["Top", "Bottom", "Shoes", "Outerwear"],
    styleType: ["Casual", "Professional"],
    occasions: ["Everyday", "Work"],
    wardrobeComposition: "pants-shirts",
    items: [
      // TOPS (8 items)
      {
        id: "white-tee",
        category: "Top",
        description: "White crew neck t-shirt",
        essential: true,
        color: "white",
        style_tags: ["basic", "casual", "neutral"],
        placeholder_image: "👕",
        shopping_links: [
          { retailer: "Uniqlo", price: 15, url: "#", badge: "Best Value" },
          { retailer: "Everlane", price: 25, url: "#", badge: "Best Quality" },
          { retailer: "Amazon Essentials", price: 12, url: "#" },
        ]
      },
      {
        id: "black-tee",
        category: "Top",
        description: "Black crew neck t-shirt",
        essential: true,
        color: "black",
        style_tags: ["basic", "casual", "neutral"],
        placeholder_image: "👕",
        shopping_links: [
          { retailer: "Uniqlo", price: 15, url: "#", badge: "Best Value" },
          { retailer: "Everlane", price: 25, url: "#" },
          { retailer: "Amazon Essentials", price: 12, url: "#" },
        ]
      },
      {
        id: "grey-henley",
        category: "Top",
        description: "Grey henley shirt",
        essential: true,
        color: "grey",
        style_tags: ["casual", "layering"],
        placeholder_image: "👕",
        shopping_links: [
          { retailer: "J.Crew", price: 45, url: "#" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-oxford",
        category: "Top",
        description: "Navy button-down oxford shirt",
        essential: true,
        color: "navy",
        style_tags: ["professional", "casual", "versatile"],
        placeholder_image: "👔",
        shopping_links: [
          { retailer: "J.Crew", price: 79, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "white-oxford",
        category: "Top",
        description: "White button-down oxford shirt",
        essential: true,
        color: "white",
        style_tags: ["professional", "formal", "versatile"],
        placeholder_image: "👔",
        shopping_links: [
          { retailer: "Everlane", price: 68, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "grey-sweater",
        category: "Top",
        description: "Charcoal grey crew sweater",
        essential: true,
        color: "grey",
        style_tags: ["casual", "layering", "winter"],
        placeholder_image: "🧥",
        shopping_links: [
          { retailer: "Everlane", price: 85, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 39, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-cardigan",
        category: "Top",
        description: "Navy cardigan",
        essential: false,
        color: "navy",
        style_tags: ["casual", "layering"],
        placeholder_image: "🧥",
        shopping_links: [
          { retailer: "J.Crew", price: 98, url: "#" },
          { retailer: "Uniqlo", price: 49, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "beige-hoodie",
        category: "Top",
        description: "Beige hoodie",
        essential: false,
        color: "beige",
        style_tags: ["casual", "athletic"],
        placeholder_image: "👕",
        shopping_links: [
          { retailer: "Everlane", price: 68, url: "#" },
          { retailer: "Champion", price: 40, url: "#", badge: "Best Value" },
        ]
      },
      // BOTTOMS (4 items)
      {
        id: "khaki-chinos",
        category: "Bottom",
        description: "Khaki chinos",
        essential: true,
        color: "khaki",
        style_tags: ["casual", "professional", "versatile"],
        placeholder_image: "👖",
        shopping_links: [
          { retailer: "Bonobos", price: 98, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 39, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "black-jeans",
        category: "Bottom",
        description: "Black slim jeans",
        essential: true,
        color: "black",
        style_tags: ["casual", "versatile"],
        placeholder_image: "👖",
        shopping_links: [
          { retailer: "Levi's", price: 98, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 49, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-trousers",
        category: "Bottom",
        description: "Navy tailored trousers",
        essential: true,
        color: "navy",
        style_tags: ["professional", "formal"],
        placeholder_image: "👖",
        shopping_links: [
          { retailer: "Everlane", price: 98, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 49, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "grey-joggers",
        category: "Bottom",
        description: "Grey joggers",
        essential: false,
        color: "grey",
        style_tags: ["casual", "athletic"],
        placeholder_image: "👖",
        shopping_links: [
          { retailer: "Lululemon", price: 118, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 39, url: "#", badge: "Best Value" },
        ]
      },
      // SHOES (4 items)
      {
        id: "white-sneakers",
        category: "Shoes",
        description: "White leather sneakers",
        essential: true,
        color: "white",
        style_tags: ["casual", "versatile"],
        placeholder_image: "👟",
        shopping_links: [
          { retailer: "Adidas", price: 100, url: "#" },
          { retailer: "Veja", price: 150, url: "#", badge: "Best Quality" },
          { retailer: "Amazon", price: 45, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "brown-loafers",
        category: "Shoes",
        description: "Brown leather loafers",
        essential: true,
        color: "brown",
        style_tags: ["professional", "casual"],
        placeholder_image: "👞",
        shopping_links: [
          { retailer: "Cole Haan", price: 180, url: "#", badge: "Best Quality" },
          { retailer: "Clarks", price: 100, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "black-boots",
        category: "Shoes",
        description: "Black Chelsea boots",
        essential: true,
        color: "black",
        style_tags: ["versatile", "winter"],
        placeholder_image: "🥾",
        shopping_links: [
          { retailer: "Blundstone", price: 200, url: "#", badge: "Best Quality" },
          { retailer: "Dr. Martens", price: 150, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "grey-runners",
        category: "Shoes",
        description: "Grey running shoes",
        essential: false,
        color: "grey",
        style_tags: ["athletic", "casual"],
        placeholder_image: "👟",
        shopping_links: [
          { retailer: "Nike", price: 120, url: "#" },
          { retailer: "New Balance", price: 90, url: "#", badge: "Best Value" },
        ]
      },
      // OUTERWEAR (4 items)
      {
        id: "navy-blazer",
        category: "Outerwear",
        description: "Navy blazer",
        essential: true,
        color: "navy",
        style_tags: ["professional", "formal"],
        placeholder_image: "🧥",
        shopping_links: [
          { retailer: "J.Crew", price: 298, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 99, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "black-bomber",
        category: "Outerwear",
        description: "Black bomber jacket",
        essential: true,
        color: "black",
        style_tags: ["casual", "versatile"],
        placeholder_image: "🧥",
        shopping_links: [
          { retailer: "Everlane", price: 168, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 79, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "beige-trench",
        category: "Outerwear",
        description: "Beige trench coat",
        essential: false,
        color: "beige",
        style_tags: ["professional", "rain"],
        placeholder_image: "🧥",
        shopping_links: [
          { retailer: "Burberry", price: 1890, url: "#", badge: "Best Quality" },
          { retailer: "Everlane", price: 198, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "grey-parka",
        category: "Outerwear",
        description: "Grey parka",
        essential: false,
        color: "grey",
        style_tags: ["winter", "casual"],
        placeholder_image: "🧥",
        shopping_links: [
          { retailer: "The North Face", price: 299, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 149, url: "#", badge: "Best Value" },
        ]
      },
    ]
  },
  {
    id: "business-professional",
    name: "Business Professional - Suiting",
    description: "25 polished pieces for a complete work wardrobe. Structured, tailored, and professional.",
    preview_image_url: "💼",
    total_items: 25,
    total_outfits: 89,
    season: "All Season",
    style: "Professional",
    colorPalette: ["Navy", "Charcoal", "White", "Light Blue", "Burgundy"],
    categories: ["Top", "Bottom", "Shoes", "Outerwear"],
    styleType: ["Professional"],
    occasions: ["Work"],
    wardrobeComposition: "pants-shirts",
    items: [
      {
        id: "navy-blazer",
        category: "Outerwear",
        description: "Navy blazer",
        essential: true,
        color: "navy",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "J.Crew", price: 298, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 99, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "charcoal-blazer",
        category: "Outerwear",
        description: "Charcoal grey blazer",
        essential: true,
        color: "charcoal",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Everlane", price: 248, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 99, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "white-dress-shirt",
        category: "Top",
        description: "White dress shirt",
        essential: true,
        color: "white",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Everlane", price: 68, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "light-blue-dress-shirt",
        category: "Top",
        description: "Light blue dress shirt",
        essential: true,
        color: "light blue",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Bonobos", price: 98, url: "#" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-dress-pants",
        category: "Bottom",
        description: "Navy dress pants",
        essential: true,
        color: "navy",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Bonobos", price: 128, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 59, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "charcoal-dress-pants",
        category: "Bottom",
        description: "Charcoal grey dress pants",
        essential: true,
        color: "charcoal",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Bonobos", price: 128, url: "#" },
          { retailer: "Uniqlo", price: 59, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "black-oxford-shoes",
        category: "Shoes",
        description: "Black oxford dress shoes",
        essential: true,
        color: "black",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Allen Edmonds", price: 395, url: "#", badge: "Best Quality" },
          { retailer: "Clarks", price: 120, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "brown-oxford-shoes",
        category: "Shoes",
        description: "Brown oxford dress shoes",
        essential: false,
        color: "brown",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Allen Edmonds", price: 395, url: "#" },
          { retailer: "Clarks", price: 120, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "white-dress-shirt-2",
        category: "Top",
        description: "White dress shirt #2",
        essential: true,
        color: "white",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Everlane", price: 68, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "pink-dress-shirt",
        category: "Top",
        description: "Pink dress shirt",
        essential: false,
        color: "pink",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Bonobos", price: 98, url: "#" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-suit-jacket",
        category: "Outerwear",
        description: "Navy suit jacket",
        essential: true,
        color: "navy",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Suitsupply", price: 399, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 179, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "charcoal-suit-jacket",
        category: "Outerwear",
        description: "Charcoal suit jacket",
        essential: true,
        color: "charcoal",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Suitsupply", price: 399, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 179, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-tie",
        category: "Accessories",
        description: "Navy tie",
        essential: true,
        color: "navy",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Brooks Brothers", price: 79, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 19, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "burgundy-tie",
        category: "Accessories",
        description: "Burgundy tie",
        essential: false,
        color: "burgundy",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Brooks Brothers", price: 79, url: "#" },
          { retailer: "Uniqlo", price: 19, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "grey-tie",
        category: "Accessories",
        description: "Grey tie",
        essential: false,
        color: "grey",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Brooks Brothers", price: 79, url: "#" },
          { retailer: "Uniqlo", price: 19, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "striped-tie",
        category: "Accessories",
        description: "Striped tie",
        essential: false,
        color: "navy/white",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Brooks Brothers", price: 79, url: "#" },
          { retailer: "Uniqlo", price: 19, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "pocket-square",
        category: "Accessories",
        description: "Pocket square",
        essential: false,
        color: "white",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Brooks Brothers", price: 35, url: "#" },
          { retailer: "Uniqlo", price: 9, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "dress-watch",
        category: "Accessories",
        description: "Dress watch",
        essential: true,
        color: "silver",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Citizen", price: 295, url: "#", badge: "Best Quality" },
          { retailer: "Timex", price: 75, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "cufflinks",
        category: "Accessories",
        description: "Cufflinks",
        essential: false,
        color: "silver",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Brooks Brothers", price: 65, url: "#" },
          { retailer: "Amazon", price: 15, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "leather-briefcase",
        category: "Accessories",
        description: "Leather briefcase",
        essential: true,
        color: "black",
        style_tags: ["formal", "professional", "work"],
        shopping_links: [
          { retailer: "Tumi", price: 595, url: "#", badge: "Best Quality" },
          { retailer: "Samsonite", price: 149, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "grey-dress-pants",
        category: "Bottom",
        description: "Grey dress pants",
        essential: false,
        color: "grey",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Bonobos", price: 128, url: "#" },
          { retailer: "Uniqlo", price: 59, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "navy-polo-business",
        category: "Top",
        description: "Navy polo shirt",
        essential: false,
        color: "navy",
        style_tags: ["business-casual"],
        shopping_links: [
          { retailer: "Lacoste", price: 98, url: "#" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "black-leather-belt",
        category: "Accessories",
        description: "Black leather belt",
        essential: true,
        color: "black",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Allen Edmonds", price: 95, url: "#", badge: "Best Quality" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      },
      {
        id: "brown-leather-belt",
        category: "Accessories",
        description: "Brown leather belt",
        essential: true,
        color: "brown",
        style_tags: ["formal", "professional"],
        shopping_links: [
          { retailer: "Allen Edmonds", price: 95, url: "#" },
          { retailer: "Uniqlo", price: 29, url: "#", badge: "Best Value" },
        ]
      }
    ]
  }
];

// Matching logic
export const matchCapsuleTemplate = (
  userWardrobe: any[], 
  template: CapsuleTemplate,
  manualMatches?: Record<string, any> // Map of template_item_id -> wardrobe item
): MatchResult => {
  const exact = [];
  const similar = [];
  const missing = [];
  const usedUserItems = new Set(); // Track which user items are already matched

  // First, process manual matches
  if (manualMatches) {
    template.items.forEach(templateItem => {
      const manualMatch = manualMatches[templateItem.id];
      if (manualMatch) {
        console.log(`✅ Using manual match for ${templateItem.description}:`, manualMatch);
        exact.push({ templateItem, userItem: manualMatch });
        usedUserItems.add(manualMatch.id);
      }
    });
  }

  // Then, do auto-matching for remaining items
  template.items.forEach(templateItem => {
    // Skip if already manually matched
    if (manualMatches && manualMatches[templateItem.id]) {
      return;
    }

    let bestMatch = null;
    let bestScore = 0;
    let bestReason = '';

    userWardrobe.forEach(userItem => {
      // Skip if this user item is already matched to another template item
      if (usedUserItems.has(userItem.id)) return;

      let score = 0;
      const reasons = [];

      // Get text to analyze
      const aiText = (userItem.ai_analysis || '').toLowerCase();
      const userDesc = (userItem.description || '').toLowerCase();
      const templateName = templateItem.description.toLowerCase();
      const templateDesc = (templateItem.description || '').toLowerCase();

      // === CATEGORY MATCHING (40 points max) ===
      
      // Exact category match
      if (userItem.category === templateItem.category) {
        score += 40;
        reasons.push('same category');
      }
      // Related categories (shoes/accessories)
      else if (
        (userItem.category === 'Shoes' && templateItem.category === 'Shoes') ||
        (userItem.category === 'Accessories' && templateItem.category === 'Accessories')
      ) {
        score += 40;
        reasons.push('matching category');
      }

      // === ITEM TYPE MATCHING (30 points max) ===
      
      // Extract key item types from template name
      const itemTypeKeywords = {
        // Shoes
        'oxford': ['oxford', 'dress shoe', 'formal shoe'],
        'loafer': ['loafer', 'slip-on', 'penny loafer'],
        'sneaker': ['sneaker', 'trainer', 'running shoe', 'athletic shoe'],
        'boot': ['boot', 'chelsea', 'ankle boot'],
        'sandal': ['sandal', 'slide', 'birkenstock'],
        
        // Shirts
        't-shirt': ['t-shirt', 'tee', 'crew neck'],
        'polo': ['polo', 'polo shirt', 'pique'],
        'oxford shirt': ['oxford', 'button-down', 'button down', 'dress shirt'],
        'henley': ['henley'],
        
        // Pants
        'chino': ['chino', 'khaki'],
        'jean': ['jean', 'denim'],
        'trouser': ['trouser', 'dress pant', 'wool pant'],
        
        // Outerwear
        'blazer': ['blazer', 'sport coat', 'suit jacket'],
        'sweater': ['sweater', 'jumper', 'pullover', 'knit'],
        'hoodie': ['hoodie', 'hooded'],
        'jacket': ['jacket', 'coat']
      };

      // Find which type this template item is
      let templateType = null;
      for (const [type, keywords] of Object.entries(itemTypeKeywords)) {
        if (keywords.some(kw => templateName.includes(kw))) {
          templateType = type;
          break;
        }
      }

      // Check if user item matches this type
      if (templateType) {
        const typeKeywords = itemTypeKeywords[templateType];
        const matchesType = typeKeywords.some(kw => 
          aiText.includes(kw) || userDesc.includes(kw)
        );
        
        if (matchesType) {
          score += 30;
          reasons.push(`matching ${templateType}`);
        }
      }

      // === COLOR MATCHING (20 points max) ===
      
      const userColor = (userItem.color || '').toLowerCase();
      const templateColor = (templateItem.color || '').toLowerCase();

      if (userColor && templateColor) {
        // Exact color match
        if (userColor === templateColor) {
          score += 20;
          reasons.push('exact color match');
        }
        // Similar colors
        else if (
          (userColor.includes('blue') && templateColor.includes('blue')) ||
          (userColor.includes('navy') && templateColor.includes('navy')) ||
          (userColor.includes('black') && templateColor.includes('black')) ||
          (userColor.includes('white') && templateColor.includes('white')) ||
          (userColor.includes('grey') && templateColor.includes('gray')) ||
          (userColor.includes('gray') && templateColor.includes('grey')) ||
          (userColor.includes('brown') && templateColor.includes('brown')) ||
          (userColor.includes('tan') && templateColor.includes('tan')) ||
          (userColor.includes('khaki') && templateColor.includes('tan'))
        ) {
          score += 15;
          reasons.push('similar color');
        }
        // Related colors (e.g., navy = dark blue)
        else if (
          (userColor.includes('navy') && templateColor.includes('blue')) ||
          (userColor.includes('blue') && templateColor.includes('navy')) ||
          (userColor.includes('charcoal') && templateColor.includes('grey')) ||
          (userColor.includes('grey') && templateColor.includes('charcoal'))
        ) {
          score += 10;
          reasons.push('related color');
        }
      }

      // === STYLE MATCHING (10 points max) ===
      
      // Check for style keywords in AI analysis
      const styleKeywords = {
        'formal': ['formal', 'dress', 'professional'],
        'casual': ['casual', 'relaxed', 'everyday'],
        'athletic': ['athletic', 'sport', 'gym', 'running'],
        'smart-casual': ['smart casual', 'business casual']
      };

      if (templateItem.style_tags) {
        const styleMatches = templateItem.style_tags.some(tag => {
          const keywords = styleKeywords[tag] || [tag];
          return keywords.some(kw => aiText.includes(kw));
        });
        
        if (styleMatches) {
          score += 10;
          reasons.push('matching style');
        }
      }

      // Track best match for this template item
      if (score > bestScore) {
        bestScore = score;
        bestMatch = userItem;
        bestReason = reasons.join(', ');
      }
    });

    // Classify based on score
    if (bestScore >= 70) {
      // EXACT MATCH - High confidence (70+ points)
      exact.push({ templateItem, userItem: bestMatch });
      usedUserItems.add(bestMatch.id);
    } else if (bestScore >= 45) {
      // SIMILAR MATCH - Medium confidence (45-69 points)
      similar.push({ 
        templateItem, 
        userItem: bestMatch,
        reason: bestScore >= 60 
          ? `Similar ${templateItem.category.toLowerCase()}, ${bestReason}`
          : `Similar item, but ${bestReason || 'different details'}`
      });
      usedUserItems.add(bestMatch.id);
    } else {
      // MISSING - Low confidence (< 45 points)
      // Don't match if confidence is too low
      missing.push(templateItem);
    }
  });

  return { exact, similar, missing };
};

const normalizeColor = (text: string): string => {
  const colorMap: { [key: string]: string[] } = {
    white: ['white', 'cream', 'off-white', 'ivory'],
    black: ['black', 'charcoal'],
    grey: ['grey', 'gray', 'silver'],
    blue: ['blue', 'navy', 'denim', 'indigo'],
    brown: ['brown', 'tan', 'beige', 'camel'],
  };

  const lowerText = text.toLowerCase();
  for (const [base, variants] of Object.entries(colorMap)) {
    if (variants.some(v => lowerText.includes(v))) {
      return base;
    }
  }
  return lowerText;
};

const matchesStyleTags = (analysis: string, tags: string[]): boolean => {
  const lowerAnalysis = analysis.toLowerCase();
  return tags.some(tag => lowerAnalysis.includes(tag.toLowerCase()));
};

const getSimilarityReason = (userItem: any, templateItem: CapsuleTemplateItem): string => {
  const userColor = normalizeColor(userItem.ai_analysis || '');
  const templateColor = normalizeColor(templateItem.color);
  
  if (userColor !== templateColor) {
    return `Similar ${userItem.category.toLowerCase()}, but ${userColor} instead of ${templateColor}`;
  }
  
  return `Similar style in same category`;
};

export const calculateCompletionPercentage = (match: MatchResult, template: CapsuleTemplate): number => {
  const owned = match.exact.length + match.similar.length;
  return Math.round((owned / template.total_items) * 100);
};

export const calculateBudget = (missing: CapsuleTemplateItem[]): number => {
  return missing.reduce((total, item) => {
    // Skip items with no shopping links
    if (!item.shopping_links || item.shopping_links.length === 0) {
      return total;
    }
    
    const bestValue = item.shopping_links.find(link => link.badge === "Best Value");
    const cheapest = bestValue || item.shopping_links.reduce((min, link) => 
      link.price < min.price ? link : min
    , item.shopping_links[0]); // Provide initial value
    
    return total + (cheapest?.price || 0);
  }, 0);
};
