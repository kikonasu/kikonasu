interface WardrobeItem {
  id: string;
  category: string;
  image_url: string;
  signedUrl?: string;
}

export const calculateOutfits = (items: WardrobeItem[]) => {
  const tops = items.filter(i => i.category === 'Top').length;
  const bottoms = items.filter(i => i.category === 'Bottom').length;
  const shoes = items.filter(i => i.category === 'Shoes').length;
  const dresses = items.filter(i => i.category === 'Dress').length;
  
  // Basic: tops × bottoms × shoes
  const basicOutfits = tops * bottoms * shoes;
  
  // Add dress outfits (dress + shoes)
  const dressOutfits = dresses * shoes;
  
  // With outerwear (optional layering - doubles combinations)
  const outerwear = items.filter(i => i.category === 'Outerwear').length;
  const layeredOutfits = outerwear > 0 ? (basicOutfits + dressOutfits) * outerwear : 0;
  
  return basicOutfits + dressOutfits + layeredOutfits;
};

export const calculateCategoryBreakdown = (items: WardrobeItem[]) => {
  const categories = ['Top', 'Bottom', 'Shoes', 'Dress', 'Outerwear', 'Accessory'];
  return categories.map(category => ({
    category,
    count: items.filter(i => i.category === category).length
  })).filter(c => c.count > 0);
};

export const suggestGaps = (selectedItems: WardrobeItem[], allItems: WardrobeItem[]) => {
  const currentOutfits = calculateOutfits(selectedItems);
  
  const suggestions = allItems
    .filter(item => !selectedItems.find(si => si.id === item.id))
    .map(item => {
      const withItem = [...selectedItems, item];
      const newOutfits = calculateOutfits(withItem);
      return {
        item,
        outfitIncrease: newOutfits - currentOutfits,
        newTotal: newOutfits
      };
    })
    .sort((a, b) => b.outfitIncrease - a.outfitIncrease)
    .slice(0, 5);
    
  return suggestions;
};

export const getCategoryEmoji = (category: string) => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('top') || categoryLower.includes('shirt')) return '👕';
  if (categoryLower.includes('bottom') || categoryLower.includes('pant') || categoryLower.includes('jean')) return '👖';
  if (categoryLower.includes('shoes') || categoryLower.includes('sneaker')) return '👟';
  if (categoryLower.includes('dress')) return '👗';
  if (categoryLower.includes('outerwear') || categoryLower.includes('jacket') || categoryLower.includes('coat')) return '🧥';
  if (categoryLower.includes('accessory')) return '👜';
  return '👔';
};
