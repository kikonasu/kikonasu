const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export const searchUnsplashImage = async (query: string): Promise<string | null> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('VITE_UNSPLASH_ACCESS_KEY is not set');
    return null;
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return regular size URL (good balance of quality and speed)
      return data.results[0].urls.regular;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch from Unsplash:', error);
    return null;
  }
};

// Batch fetch images for multiple items
export const fetchMultipleImages = async (
  items: Array<{ id: string; searchQuery: string }>
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  // Fetch in parallel but respect rate limits (50/hour = ~1 per minute safe)
  for (const item of items) {
    const imageUrl = await searchUnsplashImage(item.searchQuery);
    if (imageUrl) {
      results[item.id] = imageUrl;
    }
    // Small delay to be respectful of API limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};
