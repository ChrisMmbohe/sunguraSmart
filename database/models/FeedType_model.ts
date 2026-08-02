import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { FeedCategory, FeedUnit } from '../../types/enums';
import { round2, nonNegative } from '../utils/ownership.util';

export interface IFeedType extends Document, ITenantFields {
  _id: Types.ObjectId;
  name: string; // e.g. "Rabbit Pellets - Grower"
  category: FeedCategory;
  unit: FeedUnit;
  stockOnHand: number; // in `unit`
  reorderThreshold: number; // trigger a low-stock alert below this level
  costPerUnit?: number;
  /** Reference consumption rate, e.g. pellets: 0.1 kg/rabbit/day,
   *  hay: 1 bale / 14 days / rabbit. Used by feed-planning calculations. */
  consumptionRatePerRabbit: number;
  consumptionPeriodDays: number; // the "per X days" denominator
  createdAt: Date;
  updatedAt: Date;
}

interface IFeedTypeModel extends Model<IFeedType> {
  lowStock(userId: string): Promise<IFeedType[]>;
}

const FeedTypeSchema = new Schema<IFeedType, IFeedTypeModel>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: Object.values(FeedCategory), required: true },
    unit: { type: String, enum: Object.values(FeedUnit), required: true },
    stockOnHand: { type: Number, default: 0, min: 0 },
    reorderThreshold: { type: Number, default: 0, min: 0 },
    costPerUnit: { type: Number, min: 0 },
    // Sensible defaults: 100g pellets/day, 1 hay bale / 2 weeks, per rabbit.
    consumptionRatePerRabbit: { type: Number, required: true, default: 0.1, min: 0 },
    consumptionPeriodDays: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

FeedTypeSchema.plugin(tenantPlugin);

FeedTypeSchema.index({ userId: 1, name: 1 }, { unique: true });
FeedTypeSchema.index({ userId: 1, category: 1 });

FeedTypeSchema.pre('save', function (next) {
  this.stockOnHand = round2(nonNegative(this.stockOnHand));
  next();
});

FeedTypeSchema.statics.lowStock = function (userId: string) {
  return this.find({ userId, $expr: { $lte: ['$stockOnHand', '$reorderThreshold'] } });
};

export const FeedType =
  (models.FeedType as IFeedTypeModel) || model<IFeedType, IFeedTypeModel>('FeedType', FeedTypeSchema);
