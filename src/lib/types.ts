export interface Product {
  id: string;
  name: string;
  category: 'Men' | 'Women' | 'Kids';
  productType: string;
  price: number;
  images: string[];
  description: string;
  stockStatus: 'Available' | 'Out of Stock';
  tags: string[];
  isTrending: boolean;
  isDealOfTheDay: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  strap?: string;
  color?: string;
  sizes?: string[];
  fit?: string;
  sleeve?: string;
  createdAt: string;
}

export interface Image {
  id: string;
  url: string;
  altText: string;
  createdAt: string;
}

export interface Category {
  name: string;
  slug: string;
  image: string;
  description: string;
  subCategories: SubCategory[];
}

export interface BusinessDetails {
  shop_name: string;
  phone: string;
  email: string;
  address: string;
  payment_mode: string;
  gpay: {
    email: string;
    number: string;
  };
}

export interface SubCategory {
  name: string;
  slug: string;
}

export interface NavLink {
  name: string;
  slug: string;
}
export interface UserProfile {
  role: 'admin' | 'user';
  displayName?: string;
  photoURL?: string;
}

