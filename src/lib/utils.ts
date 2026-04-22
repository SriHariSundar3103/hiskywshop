import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures an image URL is valid for Next.js Image component.
 * If the URL is shorthand (like 'hsk-m-001') or a placeholder ID, 
 * it falls back to a reliable picsum.photos URL.
 */
export function getSafeImageUrl(url: string | null | undefined, id?: string) {
  if (!url) return '/hero section.jpg';
  
  // Handle malformed/nested picsum URLs
  if (url.includes('picsum.photos/seed/')) {
    const lastSeedIndex = url.lastIndexOf('/seed/') + 6;
    const seedPart = url.substring(lastSeedIndex).split('/')[0];
    // Filter out nested protocol strings
    const cleanSeed = seedPart.replace(/^https?%3A%2F%2F/, '').replace(/^https?:\/\//, '');
    return `https://picsum.photos/seed/${cleanSeed}/800/800`;
  }

  // If it's a full URL or a standard root-relative path, use it
  if (url.startsWith('http') || url.startsWith('/') && !url.startsWith('/placeholder/')) {
    return url;
  }
  
  // For shorthand IDs, /placeholder/ IDs, or empty strings, use picsum
  const seed = id || url.replace('/placeholder/', '') || 'watch';
  return `https://picsum.photos/seed/${seed}/800/800`;
}
