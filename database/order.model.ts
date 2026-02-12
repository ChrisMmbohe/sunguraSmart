import mongoose, { Schema } from 'mongoose';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number; // Price at time of purchase
  image?: string;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrder {
  _id?: mongoose.Types.ObjectId;
  userId: string; // Clerk user ID
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: null },
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true, index: true },
    items: [OrderItemSchema],
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    stripePaymentIntentId: { type: String, default: null },
    stripeSessionId: { type: String, default: null },
    notes: { type: String, default: null },
    paidAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ stripePaymentIntentId: 1 });

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
