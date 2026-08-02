import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { SaleItemType, PaymentMethod, RabbitStatus, CageStatus } from '../../types/enums';
import { Rabbit } from './Rabbit_model';
import { Cage } from './Cage_model';
import { round2 } from '../utils/ownership.util';

export interface ISaleItem {
  itemType: SaleItemType;
  rabbit?: Types.ObjectId | null; // set when itemType === live_rabbit
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface ISale extends Document, ITenantFields {
  _id: Types.ObjectId;
  buyerName: string;
  buyerContact?: string;
  items: ISaleItem[];
  totalAmount: number; // derived, kept denormalized for fast finance queries
  paymentMethod: PaymentMethod;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMonthlyAmount {
  year: number;
  month: number; // 1-12
  total: number;
}

export interface ISaleModel extends Model<ISale> {
  totalRevenue(userId: string, from?: Date, to?: Date): Promise<number>;
  revenueByItemType(userId: string, from?: Date, to?: Date): Promise<{ itemType: SaleItemType; total: number }[]>;
  monthlyRevenueTrend(userId: string, months?: number): Promise<IMonthlyAmount[]>;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    itemType: { type: String, enum: Object.values(SaleItemType), required: true },
    rabbit: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null },
    description: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale, ISaleModel>(
  {
    buyerName: { type: String, required: true, trim: true },
    buyerContact: { type: String, trim: true },
    items: {
      type: [SaleItemSchema],
      validate: [(arr: ISaleItem[]) => arr.length > 0, 'A sale must have at least one item.'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.CASH },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

SaleSchema.plugin(tenantPlugin);

SaleSchema.index({ userId: 1, date: -1 });

SaleSchema.pre('validate', function (next) {
  this.totalAmount = round2(this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  next();
});

// Selling a live rabbit retires it from the active population automatically.
SaleSchema.post('save', async function (doc) {
  const rabbitIds = doc.items
    .filter((item) => item.itemType === SaleItemType.LIVE_RABBIT && item.rabbit)
    .map((item) => item.rabbit) as Types.ObjectId[];

  if (rabbitIds.length === 0) return;

  // Capture each rabbit's current cage BEFORE clearing it. Cage.currentRabbit
  // / status are denormalized fields that only get synced via the Rabbit
  // document's `save()` post-hook — the bulk `updateMany()` below does not
  // trigger that hook. Without this step a sold rabbit's cage stays marked
  // "occupied" forever, which is what was quietly corrupting the dashboard's
  // cage occupancy numbers over time.
  const soldRabbits = await Rabbit.find(
    { _id: { $in: rabbitIds }, userId: doc.userId },
    { cage: 1 }
  );
  const cageIds = soldRabbits.map((r) => r.cage).filter((c): c is Types.ObjectId => !!c);

  await Rabbit.updateMany(
    { _id: { $in: rabbitIds }, userId: doc.userId },
    { status: RabbitStatus.SOLD, cage: null }
  );

  if (cageIds.length > 0) {
    // Only release cages that still point at one of the rabbits we just
    // sold — guards against clobbering a cage that was already reassigned
    // to a different rabbit in between.
    await Cage.updateMany(
      { _id: { $in: cageIds }, userId: doc.userId, currentRabbit: { $in: rabbitIds } },
      { currentRabbit: null, status: CageStatus.EMPTY }
    );
  }
});

SaleSchema.statics.totalRevenue = async function (userId: string, from?: Date, to?: Date) {
  const match: Record<string, unknown> = { userId };
  if (from || to) {
    match.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }
  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  return result[0]?.total ?? 0;
};

SaleSchema.statics.revenueByItemType = async function (userId: string, from?: Date, to?: Date) {
  const match: Record<string, unknown> = { userId };
  if (from || to) {
    match.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }
  const result = await this.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.itemType',
        total: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
      },
    },
  ]);
  return result.map((r) => ({ itemType: r._id, total: r.total }));
};

SaleSchema.statics.monthlyRevenueTrend = async function (userId: string, months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const result = await this.aggregate([
    { $match: { userId, date: { $gte: since } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$totalAmount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return result.map((r) => ({ year: r._id.year, month: r._id.month, total: r.total }));
};

export const Sale = (models.Sale as ISaleModel) || model<ISale, ISaleModel>('Sale', SaleSchema);
