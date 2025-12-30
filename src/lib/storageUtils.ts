import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a signed URL for a private storage file
 * @param filePath - The path to the file in storage
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns The signed URL or the original path if generation fails
 */
export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string> => {
  try {
    // If it's already a full URL, return it as-is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log('✓ Using existing full URL:', filePath.substring(0, 50) + '...');
      return filePath;
    }

    console.log('🔐 Generating signed URL for path:', filePath);
    const { data, error } = await supabase.storage
      .from('wardrobe-images')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('❌ Error generating signed URL:', error, 'for path:', filePath);
      return filePath; // Fallback to original path
    }

    if (!data?.signedUrl) {
      console.error('❌ No signed URL returned for path:', filePath);
      return filePath;
    }

    console.log('✓ Signed URL generated successfully');
    return data.signedUrl;
  } catch (error) {
    console.error('❌ Exception generating signed URL:', error, 'for path:', filePath);
    return filePath; // Fallback to original path
  }
};

/**
 * Generate signed URLs for multiple file paths
 * @param filePaths - Array of file paths
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Array of signed URLs
 */
export const getSignedUrls = async (filePaths: string[], expiresIn: number = 3600): Promise<string[]> => {
  return Promise.all(filePaths.map(path => getSignedUrl(path, expiresIn)));
};
