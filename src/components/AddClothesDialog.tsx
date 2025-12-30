import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCw, Upload, Camera, Loader2 } from "lucide-react";

interface AddClothesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (itemId?: string) => void;
  prefilledCategory?: string;
}

type Category = "Top" | "Bottom" | "Shoes" | "Dress" | "Outerwear" | "Accessory";

export const AddClothesDialog = ({ open, onOpenChange, onItemAdded, prefilledCategory }: AddClothesDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [rotation, setRotation] = useState(0);
  const [category, setCategory] = useState<Category | null>(prefilledCategory as Category || null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [showTips, setShowTips] = useState(() => {
    return localStorage.getItem("hidePhotoTips") !== "true";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDismissTips = () => {
    setShowTips(false);
    localStorage.setItem("hidePhotoTips", "true");
  };

  const classifyImage = async (file: File) => {
    setClassifying(true);
    console.log("🔍 Starting AI classification...");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('classify-clothing', {
          body: { imageBase64: base64 }
        });

        if (!error && data?.category) {
          console.log("✓ Classification complete:", data.category);
          setCategory(data.category as Category);
          setAiAnalysis(data.description || null);
          setAutoDetected(true);
        } else {
          console.log("⚠️ Classification failed or returned no category");
        }
        
        setClassifying(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Classification error:", error);
      setClassifying(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setRotation(0);
      setCategory(null);
      setAiAnalysis(null);
      setAutoDetected(false);
      classifyImage(file);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Resize image to max dimensions while maintaining aspect ratio
  const resizeImage = async (
    file: File,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    format: 'jpeg' | 'webp' = 'jpeg',
    quality: number = 0.85
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Only resize if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => resolve(blob!), `image/${format}`, quality);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Generate thumbnail (400px width, WebP format for better compression)
  const generateThumbnail = async (file: File): Promise<Blob> => {
    return resizeImage(file, 400, 400, 'webp', 0.80);
  };

  const rotateImage = async (file: File, degrees: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!selectedFile || !category) {
      toast.error("Please select an image and category");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First resize the image to reduce file size
      console.log('📐 Resizing image...');
      const resizedBlob = await resizeImage(selectedFile);
      let fileToUpload = new File([resizedBlob], selectedFile.name, { type: "image/jpeg" });

      // Generate thumbnail for grid views (400px WebP)
      console.log('🖼️ Generating thumbnail...');
      const thumbnailBlob = await generateThumbnail(selectedFile);

      // Then apply rotation if needed
      if (rotation !== 0) {
        const rotatedBlob = await rotateImage(fileToUpload, rotation);
        fileToUpload = new File([rotatedBlob], selectedFile.name, { type: "image/jpeg" });
      }

      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.jpg`;
      const thumbFileName = `${user.id}/thumb_${timestamp}.webp`;

      console.log('📤 Uploading images:', { fileName, thumbFileName, category });

      // Upload both original and thumbnail in parallel
      const [uploadResult, thumbResult] = await Promise.all([
        supabase.storage.from("wardrobe-images").upload(fileName, fileToUpload),
        supabase.storage.from("wardrobe-images").upload(thumbFileName, thumbnailBlob, {
          contentType: 'image/webp'
        })
      ]);

      if (uploadResult.error) {
        console.error('❌ Upload failed:', uploadResult.error);
        throw uploadResult.error;
      }

      if (thumbResult.error) {
        console.warn('⚠️ Thumbnail upload failed (non-critical):', thumbResult.error);
        // Continue anyway - thumbnail is optional enhancement
      }

      console.log('✓ Upload successful, saving to database');

      // Store only the file path (not full URL) - WardrobeItemImage will handle URL generation
      const { data: insertedData, error: dbError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          image_url: fileName, // Store path only for consistent handling
          category,
          ai_analysis: aiAnalysis,
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert failed:', dbError);
        throw dbError;
      }

      console.log('✓ Item saved to database');

      // Track item upload event
      await supabase.from("analytics_events").insert({
        user_id: user.id,
        event_type: "item_uploaded",
        event_data: { category },
      });

      toast.success("Item added to wardrobe!");
      onItemAdded(insertedData?.id);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('❌ Save failed:', error);
      const message = error instanceof Error ? error.message : "Failed to add item";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setRotation(0);
    setCategory(null);
    setAiAnalysis(null);
    setAutoDetected(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Clothes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!previewUrl ? (
            <div className="space-y-3">
              {showTips && (
                <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium">📸 Quick Photo Tips</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismissTips}
                      className="h-6 w-6 p-0 hover:bg-background"
                    >
                      ×
                    </Button>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                    <li>Lay item flat or hang it</li>
                    <li>Use good lighting</li>
                    <li>Plain background works best</li>
                  </ul>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload from Device
                  </span>
                </Button>
              </label>
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="camera-capture"
              />
              <label htmlFor="camera-capture">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <>
              <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden">
                {classifying ? (
                  <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground text-sm font-medium">🔍 Analyzing your item...</p>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain animate-fade-in"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleRotate}
                className="w-full"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate 90°
              </Button>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Category</label>
                  {autoDetected && category && !classifying && (
                    <span className="text-xs text-muted-foreground">Auto-detected ✓</span>
                  )}
                </div>
                {category && !classifying && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Looks like this is a <span className="font-medium text-foreground">{category}</span>. Change if incorrect:
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {(["Top", "Bottom", "Shoes", "Dress", "Outerwear", "Accessory"] as Category[]).map((cat) => (
                    <Button
                      key={cat}
                      variant={category === cat ? "default" : "outline"}
                      onClick={() => {
                        setCategory(cat);
                        setAutoDetected(false);
                      }}
                      className="capitalize"
                      disabled={classifying}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={uploading || !category}
                >
                  {uploading ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
