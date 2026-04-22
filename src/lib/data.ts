import type { Product, Category, BusinessDetails, SubCategory, NavLink } from './types';

export const businessDetails: BusinessDetails = {
  shop_name: "Hi/sky",
  phone: "8073324806",
  email: "kumarshiva7681@gmail.com",
  address: "Diya School Opposite, Bangalore",
  payment_mode: "Offline (Cash / GPay)",
  gpay: {
    email: "kumarshiva7681@gmail.com",
    number: "8073324806"
  }
};

export const menSubCategories: SubCategory[] = [
  { name: 'Watches', slug: 'watch' },
  { name: 'Shirts', slug: 'shirt' },
  { name: 'Pants', slug: 'pant' },
];

export const womenSubCategories: SubCategory[] = [
  { name: 'Watches', slug: 'watches' },
  { name: 'Fashion Watches', slug: 'fashion-watches' },
  { name: 'Luxury Watches', slug: 'luxury-watches' },
];

export const kidsSubCategories: SubCategory[] = [
  { name: 'Cartoon Watches', slug: 'cartoon-watches' },
  { name: 'Digital Watches', slug: 'digital-watches' },
  { name: 'Sports Watches', slug: 'sports-watches' },
];

export const categories: Category[] = [
  { 
    name: 'Men', 
    slug: 'men', 
    image: 'category-men', 
    description: `Explore our collection of men's watches, from classic timepieces to modern smartwatches.`,
    subCategories: menSubCategories,
  },
  { 
    name: 'Women', 
    slug: 'women', 
    image: 'category-women', 
    description: `Discover elegant and stylish watches for women, perfect for any occasion.`,
    subCategories: womenSubCategories,
  },
  { 
    name: 'Kids', 
    slug: 'kids', 
    image: 'category-kids', 
    description: `Fun, durable, and easy-to-read watches for the younger generation.`,
    subCategories: kidsSubCategories,
  },
];

export const otherNavLinks: NavLink[] = [
    { name: 'About', slug: 'about'},
    { name: 'Contact', slug: 'contact'},
];

// Static products removed - use Firestore admin uploads only
