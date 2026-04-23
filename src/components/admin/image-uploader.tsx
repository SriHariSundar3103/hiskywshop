'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

export function ImageUploader({ onUploadComplete, className }: ImageUploaderProps) {
  const { storage } = initializeFirebase();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPEG, or WebP image.',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File size too large',
        description: 'Image size must be less than 2MB.',
      });
      return false;
    }

    return true;
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Create a local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          toast({
            variant: 'destructive',
            title: 'Upload failed',
            description: 'There was an error uploading your image. Please try again.',
          });
          setIsUploading(false);
          setPreviewUrl(null);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          onUploadComplete(downloadUrl);
          setIsUploading(false);
          setUploadProgress(100);
          toast({
            title: 'Upload successful',
            description: 'Your image has been uploaded and added to the gallery.',
          });
        }
      );
    } catch (error) {
      console.error('Setup error:', error);
      setIsUploading(false);
      setPreviewUrl(null);
    }
  }, [storage, onUploadComplete, toast]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const resetUpload = () => {
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors duration-200',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          previewUrl && 'border-solid border-primary/20'
        )}
      >
        {previewUrl ? (
          <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-md border shadow-sm">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className={cn('object-cover transition-opacity duration-300', isUploading ? 'opacity-50' : 'opacity-100')}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {!isUploading && (
              <button
                onClick={resetUpload}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag & drop product image here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse from device
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">
              Supports PNG, JPEG, WebP (Max 2MB)
            </p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={onFileSelect}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
