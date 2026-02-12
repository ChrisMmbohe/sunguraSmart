import { z } from 'zod';

// Product schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  longDescription: z.string().max(5000).optional(),
  price: z.number().min(0, 'Price must be positive'),
  originalPrice: z.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  sku: z.string().min(1, 'SKU is required').toUpperCase(),
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    alt: z.string().optional(),
    publicId: z.string().optional(),
  })),
  tags: z.array(z.string()).optional(),
  specifications: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// Cart schemas
export const AddToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
});

// Order & Checkout schemas
export const ShippingAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Zip code is required'),
  country: z.string().min(2, 'Country is required'),
});

export const CreateOrderSchema = z.object({
  shippingAddress: ShippingAddressSchema,
  tax: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
});

// Review schemas
export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(5, 'Review title must be at least 5 characters').max(100),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
});

// Search schemas
export const SearchProductsSchema = z.object({
  query: z.string().default(''),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['newest', 'price-asc', 'price-desc', 'rating', 'popularity']).default('newest'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type SearchProductsInput = z.infer<typeof SearchProductsSchema>;
