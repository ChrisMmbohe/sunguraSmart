import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { FeedType } from './FeedType_model';
import { Rabbit } from './Rabbit_model';
import { FeedCategory, FeedUnit, RabbitStatus } from '../../types/enums';
import { round2 } from '../utils/ownership.util';

/**
 * A single log entry is either a RESTOCK (quantity added to inventory,
 * usually paired with an Expense) or a CONSUMPTION event (quantity fed
 * out, usually logged in bulk per cage-row/day rather than per rabbit).
 */
export type FeedLogDirection = 'restock' | 'consumption';

export interface IFeedLog extends Document, ITenantFields {
  _id: Types.ObjectId;
  feedType: Types.ObjectId;
  direction: FeedLogDirection;
  quantity: number; // always positive; direction determines sign applied to stock
  rabbitsFed?: number; // optional headcount, for consumption entries
  cage?: Types.ObjectId | null;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedEfficiency {
  pelletsGramsPerRabbitPerDay: number;
  activeRabbitCount: number;
  totalPelletsConsumedKg: number;
}

export interface IFeedLogModel extends Model<IFeedLog> {
  totalConsumption(userId: string, feedTypeId: Types.ObjectId, sinceDays?: number): Promise<number>;
  getFeedEfficiency(userId: string, sinceDays?: number): Promise<IFeedEfficiency>;
}

const FeedLogSchema = new Schema<IFeedLog, IFeedLogModel>(
  {
    feedType: { type: Schema.Types.ObjectId, ref: 'FeedType', required: true },
    direction: { type: String, enum: ['restock', 'consumption'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    rabbitsFed: { type: Number, min: 0 },
    cage: { type: Schema.Types.ObjectId, ref: 'Cage', default: null },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

FeedLogSchema.plugin(tenantPlugin);

FeedLogSchema.index({ userId: 1, feedType: 1, date: -1 });

FeedLogSchema.pre('save', function (next) {
  this.quantity = round2(this.quantity);
  next();
});

// Keep FeedType.stockOnHand in sync: restocks add, consumption subtracts.
// Only applied on document creation to avoid double-applying on edits;
// edits to historical logs should go through a dedicated adjustment flow.
FeedLogSchema.post('save', async function (doc) {
  if (!doc.isNew) return;

  const delta = doc.direction === 'restock' ? doc.quantity : -doc.quantity;
  const feedType = await FeedType.findOne({ _id: doc.feedType, userId: doc.userId });
  if (!feedType) return;

  feedType.stockOnHand = Math.max(0, round2(feedType.stockOnHand + delta));
  await feedType.save();
});

FeedLogSchema.statics.totalConsumption = async function (
  userId: string,
  feedTypeId: Types.ObjectId,
  sinceDays = 30
) {
  const since = new Date(Date.now() - sinceDays * 86_400_000);
  const result = await this.aggregate([
    { $match: { userId, feedType: feedTypeId, direction: 'consumption', date: { $gte: since } } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return result[0]?.total ?? 0;
};

// Grams of pellets consumed per active rabbit per day, averaged over the
// trailing window — the headline "feed efficiency" figure for the
// dashboard. Non-kg/g pellet FeedTypes (rare) are treated as kg-equivalent.
FeedLogSchema.statics.getFeedEfficiency = async function (userId: string, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 86_400_000);

  const [consumption, activeRabbitCount] = await Promise.all([
    this.aggregate([
      { $match: { userId, direction: 'consumption', date: { $gte: since } } },
      {
        $lookup: { from: 'feedtypes', localField: 'feedType', foreignField: '_id', as: 'feedTypeDoc' },
      },
      { $unwind: '$feedTypeDoc' },
      { $match: { 'feedTypeDoc.category': FeedCategory.PELLETS } },
      {
        $group: {
          _id: null,
          totalQuantity: {
            $sum: {
              $cond: [
                { $eq: ['$feedTypeDoc.unit', FeedUnit.G] },
                { $divide: ['$quantity', 1000] },
                '$quantity',
              ],
            },
          },
        },
      },
    ]),
    Rabbit.countDocuments({ userId, status: RabbitStatus.ACTIVE }),
  ]);

  const totalPelletsConsumedKg = round2(consumption[0]?.totalQuantity ?? 0);
  const pelletsGramsPerRabbitPerDay =
    activeRabbitCount > 0 ? round2((totalPelletsConsumedKg * 1000) / activeRabbitCount / sinceDays) : 0;

  return { pelletsGramsPerRabbitPerDay, activeRabbitCount, totalPelletsConsumedKg };
};

export const FeedLog =
  (models.FeedLog as IFeedLogModel) || model<IFeedLog, IFeedLogModel>('FeedLog', FeedLogSchema);
