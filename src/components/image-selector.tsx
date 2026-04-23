'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, getSafeImageUrl } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, PlusCircle } from 'lucide-react';
import { useProducts } from '@/context/product-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/admin/image-uploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageSelectorProps {
  selectedImages: string[]; // array of URLs
  onSelectionChange: (selectedUrls: string[]) => void;
}

export function ImageSelector({ selectedImages, onSelectionChange }: ImageSelectorProps) {
  const { images, addImage } = useProducts();
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageDesc, setNewImageDesc] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleImageClick = (url: string) => {
    const newSelection = selectedImages.includes(url)
      ? selectedImages.filter((imageUrl) => imageUrl !== url)
      : [...selectedImages, url];
    onSelectionChange(newSelection);
  };

  const handleAddImage = async () => {
    if (newImageUrl && newImageDesc) {
      await addImage({ url: newImageUrl, altText: newImageDesc });
      // Also auto-select the newly added image
      onSelectionChange([...selectedImages, newImageUrl]);
      setNewImageUrl('');
      setNewImageDesc('');
      setIsDialogOpen(false);
    }
  };

  const handleUploadComplete = async (url: string) => {
    // For uploaded images, we'll use a default description if none provided, 
    // or we could prompt for one. For now, let's use the filename or a generic one.
    const description = newImageDesc || 'Uploaded product image';
    await addImage({ url, altText: description });
    onSelectionChange([...selectedImages, url]);
    setNewImageDesc('');
    setIsDialogOpen(false);
  };

  // Filter out category/banner images — show only product images
  const SYSTEM_IMAGE_IDS = ['hero-banner', 'category-men', 'category-women', 'category-kids'];
  const safeImages = images || [];
  const productImages = safeImages.filter(
    (img) => !SYSTEM_IMAGE_IDS.includes(img.id)
  );

  return (
    <>
      <div className="flex justify-end mb-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Image
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Product Image</DialogTitle>
              <DialogDescription>
                Upload a file from your device or add an image using an external URL.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="url">External URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="uploadDesc">Description (for alt text)</Label>
                    <Input
                      id="uploadDesc"
                      value={newImageDesc}
                      onChange={(e) => setNewImageDesc(e.target.value)}
                      placeholder="e.g. Leather jacket front view"
                    />
                  </div>
                  <ImageUploader onUploadComplete={handleUploadComplete} />
                </TabsContent>
                <TabsContent value="url" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageDesc">Description (for alt text)</Label>
                      <Textarea
                        id="imageDesc"
                        value={newImageDesc}
                        onChange={(e) => setNewImageDesc(e.target.value)}
                        placeholder="A stylish watch on a wrist..."
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleAddImage} 
                      disabled={!newImageUrl || !newImageDesc}
                    >
                      Add from URL
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {selectedImages.length > 0 && (
        <div className="mb-4 space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Selected Order (Main image first)</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
                {selectedImages.map((url, index) => (
                    <div key={url} className="relative group">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-background">
                            <Image 
                                src={getSafeImageUrl(url)} 
                                alt={`Selected ${index}`} 
                                fill 
                                className="object-cover"
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleImageClick(url)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <span className="text-[10px] leading-none">×</span>
                        </button>
                        <div className="absolute -bottom-1 -left-1 bg-primary text-primary-foreground text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
      <ScrollArea className="h-64 rounded-md border">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-4">
          {productImages.map((image) => {
            const isSelected = selectedImages.includes(image.url);
            return (
              <div
                key={image.id}
                className={cn(
                  'relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all',
                  isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                )}
                onClick={() => handleImageClick(image.url)}
              >
                <Image
                  src={getSafeImageUrl(image.url, image.id)}
                  alt={image.altText}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
                <div
                  className={cn(
                    'absolute inset-0 transition-colors',
                    isSelected ? 'bg-black/30' : 'bg-black/0 hover:bg-black/10'
                  )}
                />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-primary rounded-full h-5 w-5 flex items-center justify-center text-primary-foreground">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                  <p className="text-white text-[10px] truncate" title={image.altText}>{image.altText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}