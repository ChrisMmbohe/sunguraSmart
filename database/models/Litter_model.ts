import { Schema, model, models, Model, Document, Types, PipelineStage } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { BreedingStatus } from '../../types/enums';
import { Breeding } from './Breeding_model';
import { nonNegative } from '../utils/ownership.util';

export interface IMortalityEvent {
  date: Date;
  count: number;
  cause?: string;
}

export interface ILitter extends Document, ITenantFields {
  _id: Types.ObjectId;
  breeding: Types.ObjectId;
  doe: Types.ObjectId;
  buck: Types.ObjectId;
  kindleDate: Date;
  kitsBornAlive: number;
  kitsBornDead: number;
  mortalityEvents: IMortalityEvent[];
  kitsWeaned?: number;
  weaningDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  kitsAlive?: number; // bornAlive - sum(mortalityEvents.count)
}

export interface ILitterAnalytics {
  avgLitterSize: number;
  avgWeaningSurvivalRate: number; // 0-1, kitsAlive-at-weaning / kitsBornAlive, weaned litters only
  activeLitters: number; // kindled but not yet weaned
  kitsBornThisMonth: number;
}

export interface ILitterModel extends Model<ILitter> {
  averageLitterSize(userId: string, breedId?: Types.ObjectId): Promise<number>;
  getLitterAnalytics(userId: string): Promise<ILitterAnalytics>;
}

const MortalityEventSchema = new Schema<IMortalityEvent>(
  {
    date: { type: Date, required: true, default: Date.now },
    count: { type: Number, required: true, min: 1 },
    cause: { type: String, trim: true },
  },
  { _id: false }
);

const LitterSchema = new Schema<ILitter, ILitterModel>(
  {
    breeding: { type: Schema.Types.ObjectId, ref: 'Breeding', required: true, unique: true },
    doe: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    buck: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    kindleDate: { type: Date, required: true, default: Date.now },
    kitsBornAlive: { type: Number, required: true, min: 0, default: 0 },
    kitsBornDead: { type: Number, required: true, min: 0, default: 0 },
    mortalityEvents: { type: [MortalityEventSchema], default: [] },
    kitsWeaned: { type: Number, min: 0 },
    weaningDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

LitterSchema.plugin(tenantPlugin);

LitterSchema.index({ userId: 1, doe: 1 });
LitterSchema.index({ userId: 1, kindleDate: -1 });

LitterSchema.virtual('kitsAlive').get(function (this: ILitter) {
  const lost = this.mortalityEvents.reduce((sum, e) => sum + e.count, 0);
  return nonNegative(this.kitsBornAlive - lost);
});
LitterSchema.set('toJSON', { virtuals: true });
LitterSchema.set('toObject', { virtuals: true });

LitterSchema.pre('save', function (next) {
  const lost = this.mortalityEvents.reduce((sum, e) => sum + e.count, 0);
  if (lost > this.kitsBornAlive) {
    return next(new Error('Total mortality count cannot exceed kits born alive.'));
  }
  if (this.kitsWeaned !== undefined && this.kitsWeaned > this.kitsBornAlive - lost) {
    return next(new Error('Kits weaned cannot exceed kits currently alive.'));
  }
  next();
});

// Back-propagate onto the parent Breeding record so its status/dates
// always reflect the litter's real-world outcome.
LitterSchema.post('save', async function (doc) {
  const update: Record<string, unknown> = {
    litter: doc._id,
    actualKindleDate: doc.kindleDate,
  };
  update.status = doc.weaningDate ? BreedingStatus.WEANED : BreedingStatus.KINDLED;

  await Breeding.findOneAndUpdate({ _id: doc.breeding, userId: doc.userId }, update);
});

LitterSchema.statics.averageLitterSize = async function (userId: string, breedId?: Types.ObjectId) {
  const match: Record<string, unknown> = { userId };
  const pipeline: PipelineStage[] = [{ $match: match }];

  if (breedId) {
    pipeline.push(
      { $lookup: { from: 'rabbits', localField: 'doe', foreignField: '_id', as: 'doeDoc' } },
      { $unwind: '$doeDoc' },
      { $match: { 'doeDoc.breed': breedId } }
    );
  }

  pipeline.push({ $group: { _id: null, avg: { $avg: '$kitsBornAlive' } } });

  const result = await this.aggregate(pipeline);
  return result[0]?.avg ?? 0;
};

LitterSchema.statics.getLitterAnalytics = async function (userId: string) {
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const pipeline: PipelineStage[] = [
    { $match: { userId } },
    {
      $addFields: {
        lostCount: { $sum: '$mortalityEvents.count' },
      },
    },
    {
      $group: {
        _id: null,
        avgLitterSize: { $avg: '$kitsBornAlive' },
        activeLitters: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ['$weaningDate', null] }, null] }, 1, 0] },
        },
        kitsBornThisMonth: {
          $sum: {
            $cond: [{ $gte: ['$kindleDate', firstOfMonth] }, '$kitsBornAlive', 0],
          },
        },
        // Weaning survival rate is only meaningful for litters that have
        // actually been weaned (kitsWeaned recorded).
        weanedBornAlive: {
          $sum: { $cond: [{ $ne: ['$kitsWeaned', null] }, '$kitsBornAlive', 0] },
        },
        weanedTotal: {
          $sum: { $cond: [{ $ne: ['$kitsWeaned', null] }, '$kitsWeaned', 0] },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  const r = result[0];

  return {
    avgLitterSize: r?.avgLitterSize ?? 0,
    avgWeaningSurvivalRate: r?.weanedBornAlive ? r.weanedTotal / r.weanedBornAlive : 0,
    activeLitters: r?.activeLitters ?? 0,
    kitsBornThisMonth: r?.kitsBornThisMonth ?? 0,
  };
};

export const Litter =
  (models.Litter as ILitterModel) || model<ILitter, ILitterModel>('Litter', LitterSchema);
