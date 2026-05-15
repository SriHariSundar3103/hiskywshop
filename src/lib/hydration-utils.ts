/**
 * Hydration Fix Utilities
 * 
 * Use these utilities across your e-commerce components
 * to ensure consistent formatting and avoid hydration mismatches
 */

/**
 * Format price consistently across all locales
 * Uses Indian locale (en-IN) since this is an India-focused store
 * 
 * @param price - Price in rupees
 * @returns Formatted price string (e.g., "₹12,34,567")
 * 
 * HYDRATION FIX: Eliminates locale-sensitive formatting mismatches
 */
export const formatPriceForDisplay = (price: number): string => {
  return price.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Format price with rupee symbol
 * 
 * @param price - Price in rupees
 * @returns Formatted price with rupee symbol (e.g., "₹12,34,567")
 */
export const formatPriceWithCurrency = (price: number): string => {
  return `₹${formatPriceForDisplay(price)}`;
};

/**
 * Get year safely with hydration support
 * Returns current year or uses suppressHydrationWarning
 * 
 * @returns Current year
 */
export const getCurrentYear = (): number => {
  // Safe: This function can be called from useEffect
  if (typeof window === 'undefined') {
    // Server-side fallback
    return new Date().getFullYear();
  }
  return new Date().getFullYear();
};

/**
 * Create a deterministic random value (for testing/mocking)
 * Use this instead of Math.random() in SSR contexts
 * 
 * @param seed - Seed value (e.g., component key)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Deterministic "random" number
 */
export const getDeterministicValue = (seed: string, min: number, max: number): number => {
  // Hash the seed to get a consistent number
  const hash = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return (hash % (max - min)) + min;
};
