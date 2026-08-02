import { Schema, model, models, Model, Document, Types, Query } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { BreedingStatus, BreedingMethod, Gender, HealthStatus, RabbitStatus } from '../../types/enums';
import { Rabbit } from './Rabbit_model';
import { Breed } from './Breed_model';
import { addDays } from '../utils/ownership.util';

export interface IBreeding extends Document, ITenantFields {
  _id: Types.ObjectId;
  doe: Types.ObjectId; // female
  buck: Types.ObjectId; // male
  method: BreedingMethod;
  pairedDate: Date;
  expectedDueDate: Date; // pairedDate + breed.gestationDays (default 31)
  status: BreedingStatus;
  confirmedPregnantDate?: Date;
  actualKindleDate?: Date;
  litter?: Types.ObjectId | null; // set once the Litter doc is created
  failureReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBreedingSuccessRate {
  successRate: number; // 0-1, kindled+weaned / all resolved (excludes still-pending pairings)
  totalResolved: number;
  successfulCount: number;
}

export interface IBreedingModel extends Model<IBreeding> {
  findDueSoon(userId: string, withinDays?: number): Query<IBreeding[], IBreeding>;
  findOverdue(userId: string): Query<IBreeding[], IBreeding>;
  getBreedingSuccessRate(userId: string, sinceDays?: number): Promise<IBreedingSuccessRate>;
}

const BreedingSchema = new Schema<IBreeding, IBreedingModel>(
  {
    doe: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    buck: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    method: {
      type: String,
      enum: Object.values(BreedingMethod),
      default: BreedingMethod.NATURAL,
    },
    pairedDate: { type: Date, required: true, default: Date.now },
    expectedDueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BreedingStatus),
      default: BreedingStatus.PAIRED,
      index: true,
    },
    confirmedPregnantDate: { type: Date },
    actualKindleDate: { type: Date },
    litter: { type: Schema.Types.ObjectId, ref: 'Litter', default: null },
    failureReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

BreedingSchema.plugin(tenantPlugin);

BreedingSchema.index({ userId: 1, status: 1, expectedDueDate: 1 });
BreedingSchema.index({ userId: 1, doe: 1 });
BreedingSchema.index({ userId: 1, buck: 1 });

// ---- Business rules ----

BreedingSchema.pre('validate', async function (next) {
  try {
    const [doe, buck] = await Promise.all([
      Rabbit.findOne({ _id: this.doe, userId: this.userId }),
      Rabbit.findOne({ _id: this.buck, userId: this.userId }),
    ]);

    if (!doe) return next(new Error('Doe not found on this farm.'));
    if (!buck) return next(new Error('Buck not found on this farm.'));

    if (doe.gender !== Gender.FEMALE) return next(new Error('Doe must be female.'));
    if (buck.gender !== Gender.MALE) return next(new Error('Buck must be male.'));

    if (doe.status !== RabbitStatus.ACTIVE) return next(new Error('Doe must be an active rabbit.'));
    if (buck.status !== RabbitStatus.ACTIVE) return next(new Error('Buck must be an active rabbit.'));

    if (doe.healthStatus === HealthStatus.SICK || doe.healthStatus === HealthStatus.QUARANTINED) {
      return next(new Error('Doe is currently marked unwell and cannot be paired.'));
    }

    // Maturity check using the doe's breed gestation/maturity config.
    if (doe.dateOfBirth) {
      const breed = await Breed.findOne({ _id: doe.breed, userId: this.userId });
      const maturityAgeDays = breed?.maturityAgeDays ?? 150;
      const ageDays = Math.floor((Date.now() - doe.dateOfBirth.getTime()) / 86_400_000);
      if (ageDays < maturityAgeDays) {
        return next(new Error('Doe has not yet reached breeding maturity age.'));
      }
    }

    // Compute the expected due date from the doe's breed gestation period (default 31 days).
    if (this.isModified('pairedDate') || this.isNew) {
      const breed = await Breed.findOne({ _id: doe.breed, userId: this.userId });
      const gestationDays = breed?.gestationDays ?? 31;
      this.expectedDueDate = addDays(this.pairedDate, gestationDays);
    }

    next();
  } catch (err) {
    next(err as Error);
  }
});

// ---- Alert-friendly statics ----

BreedingSchema.statics.findDueSoon = function (userId: string, withinDays = 3) {
  const cutoff = addDays(new Date(), withinDays);
  return this.find({
    userId,
    status: { $in: [BreedingStatus.CONFIRMED_PREGNANT, BreedingStatus.PAIRED] },
    expectedDueDate: { $lte: cutoff, $gte: new Date() },
  }).sort({ expectedDueDate: 1 });
};

BreedingSchema.statics.findOverdue = function (userId: string) {
  return this.find({
    userId,
    status: { $in: [BreedingStatus.CONFIRMED_PREGNANT, BreedingStatus.PAIRED] },
    expectedDueDate: { $lt: new Date() },
  }).sort({ expectedDueDate: 1 });
};

// Success = pairings that resulted in a kindle (kindled or weaned) out of
// all pairings that have *resolved* one way or another (kindled, weaned,
// failed, or aborted) — still-pending PAIRED/CONFIRMED_PREGNANT pairings
// are excluded so the rate isn't diluted by breedings still in progress.
BreedingSchema.statics.getBreedingSuccessRate = async function (userId: string, sinceDays?: number) {
  const match: Record<string, unknown> = {
    userId,
    status: {
      $in: [
        BreedingStatus.KINDLED,
        BreedingStatus.WEANED,
        BreedingStatus.FAILED,
        BreedingStatus.ABORTED,
      ],
    },
  };
  if (sinceDays) {
    match.pairedDate = { $gte: addDays(new Date(), -sinceDays) };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [{ $in: ['$status', [BreedingStatus.KINDLED, BreedingStatus.WEANED]] }, 1, 0],
          },
        },
      },
    },
  ]);

  const totalResolved = result[0]?.total ?? 0;
  const successfulCount = result[0]?.successful ?? 0;

  return {
    successRate: totalResolved > 0 ? successfulCount / totalResolved : 0,
    totalResolved,
    successfulCount,
  };
};

export const Breeding =
  (models.Breeding as IBreedingModel) || model<IBreeding, IBreedingModel>('Breeding', BreedingSchema);
