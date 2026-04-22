'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, PlusCircle } from 'lucide-react';
import { useProducts } from '@/context/product-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
              Add Image by URL
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddImage} disabled={!newImageUrl || !newImageDesc}>
                Add Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {productImages.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 border rounded-md">
          No images yet. Add an image by URL above, then select it.
        </p>
      )}
      <ScrollArea className="h-72 rounded-md border">
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
                  src={image.url.startsWith('/placeholder/') ? `https://picsum.photos/seed/${image.id}/600/600` : image.url}
                  alt={image.altText}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  unoptimized={!image.url.startsWith('/') && !image.url.startsWith('/placeholder/')}
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