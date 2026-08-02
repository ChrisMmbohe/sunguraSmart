import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { Gender, RabbitStatus, HealthStatus, AcquisitionType, RabbitPurpose, CageStatus } from '../../types/enums';
import { daysBetween } from '../utils/ownership.util';
import { Cage } from './Cage_model';

export interface IRabbit extends Document, ITenantFields {
  _id: Types.ObjectId;
  tagNumber: string; // farmer-facing ID, e.g. ear-tag number
  name?: string;
  breed: Types.ObjectId;
  gender: Gender;
  dateOfBirth?: Date; // undefined if unknown (some purchased adults)
  status: RabbitStatus;
  healthStatus: HealthStatus;

  // Lineage - null for externally acquired stock with unknown parentage
  sire?: Types.ObjectId | null;
  dam?: Types.ObjectId | null;

  // Acquisition
  acquisitionType: AcquisitionType;
  acquisitionDate: Date;
  sourceFarm?: string; // populated when acquisitionType is purchased/gift/transfer_in
  acquisitionCost?: number;

  purpose: RabbitPurpose;
  cage?: Types.ObjectId | null;

  // Denormalized for fast dashboard reads - kept in sync by WeightLog hook
  currentWeightKg?: number;
  lastWeighedAt?: Date;

  color?: string;
  markings?: string;
  notes?: string;

  deceasedDate?: Date;
  deceasedCause?: string;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  ageInDays?: number;
  isMature?: boolean;
}

export interface IPopulationStats {
  total: number;
  byGender: { gender: Gender; count: number }[];
  byStatus: { status: RabbitStatus; count: number }[];
  byHealthStatus: { healthStatus: HealthStatus; count: number }[];
  byBreed: { breedId: Types.ObjectId; count: number }[];
}

export interface IRabbitModel extends Model<IRabbit> {
  getPopulationStats(userId: string): Promise<IPopulationStats>;
  countPregnant(userId: string): Promise<number>;
}

const RabbitSchema = new Schema<IRabbit, IRabbitModel>(
  {
    tagNumber: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    breed: { type: Schema.Types.ObjectId, ref: 'Breed', required: true },
    gender: { type: String, enum: Object.values(Gender), required: true },
    dateOfBirth: { type: Date },
    status: {
      type: String,
      enum: Object.values(RabbitStatus),
      default: RabbitStatus.ACTIVE,
      index: true,
    },
    healthStatus: {
      type: String,
      enum: Object.values(HealthStatus),
      default: HealthStatus.HEALTHY,
      index: true,
    },

    sire: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null },
    dam: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null },

    acquisitionType: {
      type: String,
      enum: Object.values(AcquisitionType),
      required: true,
    },
    acquisitionDate: { type: Date, required: true, default: Date.now },
    sourceFarm: { type: String, trim: true },
    acquisitionCost: { type: Number, min: 0 },

    purpose: {
      type: String,
      enum: Object.values(RabbitPurpose),
      default: RabbitPurpose.BREEDING_STOCK,
    },
    cage: { type: Schema.Types.ObjectId, ref: 'Cage', default: null },

    currentWeightKg: { type: Number, min: 0 },
    lastWeighedAt: { type: Date },

    color: { type: String, trim: true },
    markings: { type: String, trim: true },
    notes: { type: String, trim: true },

    deceasedDate: { type: Date },
    deceasedCause: { type: String, trim: true },
  },
  { timestamps: true }
);

RabbitSchema.plugin(tenantPlugin);

RabbitSchema.index({ userId: 1, tagNumber: 1 }, { unique: true });
RabbitSchema.index({ userId: 1, status: 1, gender: 1 });
RabbitSchema.index({ userId: 1, breed: 1 });
RabbitSchema.index({ userId: 1, cage: 1 });

RabbitSchema.virtual('ageInDays').get(function (this: IRabbit) {
  if (!this.dateOfBirth) return undefined;
  return daysBetween(this.dateOfBirth);
});

RabbitSchema.set('toJSON', { virtuals: true });
RabbitSchema.set('toObject', { virtuals: true });

// ---- Business-rule hooks ----

/**
 * Statuses that mean the rabbit has left the physical, cage-occupying
 * population. A rabbit in any of these states cannot still be "in" a
 * cage — the cage must be released back to the available pool.
 */
const CAGE_RELEASING_STATUSES: RabbitStatus[] = [
  RabbitStatus.DECEASED,
  RabbitStatus.SOLD,
  RabbitStatus.TRANSFERRED,
];

RabbitSchema.pre('save', async function (next) {
  try {
    // Gender sanity check against parents when lineage is known.
    if (this.isModified('sire') && this.sire) {
      const sire = await Rabbit.findOne({ _id: this.sire, userId: this.userId });
      if (sire && sire.gender !== Gender.MALE) {
        return next(new Error('Assigned sire must be a male rabbit.'));
      }
    }
    if (this.isModified('dam') && this.dam) {
      const dam = await Rabbit.findOne({ _id: this.dam, userId: this.userId });
      if (dam && dam.gender !== Gender.FEMALE) {
        return next(new Error('Assigned dam must be a female rabbit.'));
      }
    }

    // A rabbit can't be its own parent.
    if (this.sire && this.sire.equals(this._id)) {
      return next(new Error('A rabbit cannot be its own sire.'));
    }
    if (this.dam && this.dam.equals(this._id)) {
      return next(new Error('A rabbit cannot be its own dam.'));
    }

    // Death/status consistency.
    if (this.status === RabbitStatus.DECEASED) {
      this.healthStatus = HealthStatus.DECEASED;
      if (!this.deceasedDate) this.deceasedDate = new Date();
    }

    // Capture whichever cage this rabbit currently occupies *before* we
    // potentially clear it below. Mongoose's post-save hook only sees the
    // document after the write, so the prior value must be read here or
    // it's lost — this is what the previous implementation missed,
    // leaving stale "occupied" cages behind on every status change.
    if (!this.isNew && (this.isModified('cage') || this.isModified('status'))) {
      const previous = await Rabbit.findById(this._id)
        .select('cage')
        .lean<{ cage?: Types.ObjectId | null } | null>();
      this.$locals.priorCage = previous?.cage ?? null;
    }

    // A rabbit that has left the active population (deceased/sold/
    // transferred) no longer physically occupies a cage — clear it here
    // so the Rabbit document itself stays consistent with reality. The
    // post-save hook below handles releasing the Cage side of things.
    if (this.isModified('status') && CAGE_RELEASING_STATUSES.includes(this.status) && this.cage) {
      this.cage = null;
    }

    next();
  } catch (err) {
    next(err as Error);
  }
});

// Keep Cage.currentRabbit / status in sync whenever a rabbit's cage
// assignment changes — this covers three cases in one hook:
//   1. Rabbit assigned to a new cage -> new cage marked occupied.
//   2. Rabbit's cage cleared/reassigned -> previous cage released.
//   3. Rabbit's status moved to deceased/sold/transferred -> the pre-save
//      hook above already nulled `cage`, so this hook releases the cage
//      it used to occupy.
RabbitSchema.post('save', async function (doc) {
  if (!doc.isModified?.('cage')) return;

  const priorCage = doc.$locals?.priorCage as Types.ObjectId | null | undefined;

  if (priorCage && String(priorCage) !== String(doc.cage ?? '')) {
    await Cage.findOneAndUpdate(
      { _id: priorCage, userId: doc.userId },
      { currentRabbit: null, status: CageStatus.EMPTY }
    );
  }

  if (doc.cage) {
    await Cage.findOneAndUpdate(
      { _id: doc.cage, userId: doc.userId },
      { currentRabbit: doc._id, status: CageStatus.OCCUPIED }
    );
  }
});

// ---- Aggregation statics (Dashboard) ----

RabbitSchema.statics.getPopulationStats = async function (userId: string) {
  const [genderAgg, statusAgg, healthAgg, breedAgg, totalAgg] = await Promise.all([
    this.aggregate([
      { $match: { userId, status: { $ne: RabbitStatus.DECEASED } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]),
    this.aggregate([{ $match: { userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    this.aggregate([
      { $match: { userId, status: { $ne: RabbitStatus.DECEASED } } },
      { $group: { _id: '$healthStatus', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { userId, status: { $ne: RabbitStatus.DECEASED } } },
      { $group: { _id: '$breed', count: { $sum: 1 } } },
    ]),
    this.countDocuments({ userId, status: { $ne: RabbitStatus.DECEASED } }),
  ]);

  return {
    total: totalAgg,
    byGender: genderAgg.map((g) => ({ gender: g._id, count: g.count })),
    byStatus: statusAgg.map((s) => ({ status: s._id, count: s.count })),
    byHealthStatus: healthAgg.map((h) => ({ healthStatus: h._id, count: h.count })),
    byBreed: breedAgg.map((b) => ({ breedId: b._id, count: b.count })),
  };
};

// Pregnant = female currently linked to a Breeding doc in CONFIRMED_PREGNANT status.
// Implemented as a lookup rather than a denormalized flag to avoid drift.
RabbitSchema.statics.countPregnant = async function (userId: string) {
  const Breeding = model('Breeding');
  return Breeding.countDocuments({ userId, status: 'confirmed_pregnant' });
};

export const Rabbit =
  (models.Rabbit as IRabbitModel) || model<IRabbit, IRabbitModel>('Rabbit', RabbitSchema);
