import { searchUnsplashImage } from '../utils/unsplashImages';

// Define search queries for each template item
export const IMAGE_SEARCH_QUERIES: Record<string, string> = {
  // SHIRTS - T-SHIRTS
  'grey-tee': 'grey crew neck t-shirt product white background',
  'navy-tee': 'navy blue crew neck t-shirt product',
  'black-tee': 'black crew neck t-shirt product',
  'white-tee': 'white crew neck t-shirt product',
  'striped-tee': 'navy white striped t-shirt product',
  
  // SHIRTS - BUTTON DOWNS
  'white-oxford': 'white oxford button down shirt product',
  'light-blue-oxford': 'light blue oxford shirt product',
  'lavender-oxford': 'lavender dress shirt product',
  'pattern-oxford': 'checkered button down shirt product',
  
  // POLO SHIRTS
  'grey-polo': 'grey polo shirt product',
  'navy-polo': 'navy blue polo shirt product',
  'black-polo': 'black polo shirt product',
  'striped-polo': 'striped polo shirt product',
  
  // SWEATERS
  'grey-crewneck': 'grey crewneck sweater product',
  'navy-crewneck': 'navy blue crewneck sweater product',
  'black-crewneck': 'black crewneck sweater product',
  'grey-hoodie': 'grey pullover hoodie product',
  'black-hoodie': 'black hoodie product',
  'grey-quarterzip': 'grey quarter zip sweater product',
  
  // OUTERWEAR
  'tan-overcoat': 'tan camel overcoat product',
  'navy-peacoat': 'navy blue peacoat product',
  'black-puffer': 'black puffer jacket product',
  'denim-jacket': 'blue denim jacket product',
  'tan-harrington': 'tan bomber jacket product',
  
  // PANTS
  'khaki-chinos': 'khaki chino pants product',
  'navy-chinos': 'navy blue chino pants product',
  'black-chinos': 'black chino pants product',
  'dark-denim': 'dark wash denim jeans product',
  'white-shorts': 'white chino shorts product',
  'khaki-shorts': 'khaki shorts product',
  
  // SUITS
  'grey-suit': 'grey wool suit jacket product',
  'navy-suit': 'navy blue suit jacket product',
  
  // SHOES
  'brown-oxfords': 'brown leather oxford dress shoes product',
  'black-oxfords': 'black leather oxford dress shoes product',
  'brown-loafers': 'brown penny loafers product',
  'white-sneakers': 'white leather sneakers product minimal',
  
  // ACCESSORIES
  'black-silk-tie': 'black silk necktie product',
  'navy-silk-tie': 'navy blue silk necktie product',
  'striped-tie': 'striped necktie product',
  'club-tie': 'club pattern necktie product',
  'critter-tie': 'novelty tie with pattern product',
  'black-boxers': 'black boxer briefs product',
  'dress-socks': 'dress socks navy black grey product',
  'casual-socks': 'casual patterned socks product',
  'dress-watch': 'brown leather strap dress watch product',
  'aviator-sunglasses': 'aviator sunglasses product',
  'wayfarer-sunglasses': 'black wayfarer sunglasses product',
};

export const fetchAllTemplateImages = async () => {
  console.log('🖼️ Starting to fetch images from Unsplash...');
  const results: Record<string, string> = {};
  
  let count = 0;
  const total = Object.keys(IMAGE_SEARCH_QUERIES).length;
  
  for (const [itemId, query] of Object.entries(IMAGE_SEARCH_QUERIES)) {
    count++;
    console.log(`📸 Fetching ${count}/${total}: ${itemId}...`);
    
    const imageUrl = await searchUnsplashImage(query);
    
    if (imageUrl) {
      results[itemId] = imageUrl;
      console.log(`✅ Found image for ${itemId}`);
    } else {
      console.log(`❌ No image found for ${itemId}`);
    }
    
    // Respect API rate limits (50/hour = ~1 per minute)
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n🎉 Finished fetching images!');
  console.log('\n📋 Copy this object and paste into capsuleTemplates.ts:');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
};
