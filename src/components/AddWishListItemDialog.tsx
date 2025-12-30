import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCw, Upload, Camera, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateOutfitPotential } from "@/lib/outfitPotential";

interface AddWishListItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
}

type Category = "Top" | "Bottom" | "Shoes" | "Dress" | "Outerwear" | "Accessory";

export const AddWishListItemDialog = ({ open, onOpenChange, onItemAdded }: AddWishListItemDialogProps) => {
  const isMobile = useIsMobile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [rotation, setRotation] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
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

      let fileToUpload = selectedFile;
      if (rotation !== 0) {
        const rotatedBlob = await rotateImage(selectedFile, rotation);
        fileToUpload = new File([rotatedBlob], selectedFile.name, { type: "image/jpeg" });
      }

      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("wardrobe-images")
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      // Calculate outfit potential
      const outfitPotential = await calculateOutfitPotential(category, user.id);

      const { error: dbError } = await supabase
        .from("wish_list_items")
        .insert({
          user_id: user.id,
          image_url: fileName,
          category,
          ai_analysis: aiAnalysis,
          notes: notes.trim() || null,
          outfit_potential: outfitPotential,
        });

      if (dbError) throw dbError;

      toast.success(`Item added to wish list! ✨ ${outfitPotential} new outfits possible`);
      onItemAdded();
      onOpenChange(false);
      resetForm();
    } catch (error) {
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
    setNotes("");
    setAutoDetected(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const content = (
    <div className="space-y-4 pb-safe">
      {!previewUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload a photo of an item you're considering purchasing
          </p>
          
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
          <div className="relative w-full max-w-sm mx-auto aspect-square bg-secondary rounded-lg overflow-hidden">
            {classifying ? (
              <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm font-medium">🔍 Analyzing item...</p>
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

          <div className="space-y-2 sticky bottom-0 bg-background pt-2 pb-4 z-10">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="e.g., Blue blazer from J.Crew - $200"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2 sticky bottom-0 bg-background pt-2 pb-4 border-t border-border mt-2">
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
              {uploading ? "Saving..." : "Save to Wish List"}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Add to Wish List</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add to Wish List</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
