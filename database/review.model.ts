import mongoose, { Schema } from 'mongoose';

export interface IReview {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  userName: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  helpful: number;
  notHelpful: number;
  verified: boolean; // Has user purchased this product?
  createdAt?: Date;
  updatedAt?: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true },
    helpful: { type: Number, default: 0, min: 0 },
    notHelpful: { type: Number, default: 0, min: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for getting reviews by product
ReviewSchema.index({ productId: 1, createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
