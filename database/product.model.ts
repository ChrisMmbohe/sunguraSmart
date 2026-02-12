import mongoose, { Schema } from 'mongoose';

export interface IProductImage {
  url: string;
  alt?: string;
  publicId?: string; // For Cloudinary
}

export interface IProductReview {
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

export interface IProduct {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number; // For showing discounts
  category: string;
  subcategory?: string;
  stock: number;
  sku: string; // Unique product code
  images: IProductImage[];
  tags?: string[];
  ratings: {
    average: number; // 0-5
    count: number;
  };
  reviews?: IProductReview[];
  specifications?: Record<string, string>; // e.g., { "size": "M", "color": "blue" }
  isActive: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  alt: { type: String, default: null },
  publicId: { type: String, default: null },
});

const ProductReviewSchema = new Schema<IProductReview>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    longDescription: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    images: [ProductImageSchema],
    tags: [{ type: String, trim: true }],
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    reviews: [ProductReviewSchema],
    specifications: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'ratings.average': -1 });

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) {
    return 0;
  }
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for in stock status
ProductSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

export const Product =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
