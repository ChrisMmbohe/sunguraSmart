import mongoose, { Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // Price at time of adding to cart
}

export interface ICart {
  _id?: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  items: ICartItem[];
  isGuestCart?: boolean;
  expiresAt?: Date; // For guest carts, auto-clean after N days
  createdAt?: Date;
  updatedAt?: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: [CartItemSchema],
    isGuestCart: { type: Boolean, default: false },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
  },
  { timestamps: true }
);

// TTL index for auto-deletion of old guest carts
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
