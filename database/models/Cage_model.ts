import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { CageStatus, CageType, RabbitStatus } from '../../types/enums';

export interface ICage extends Document, ITenantFields {
  _id: Types.ObjectId;
  label: string; // e.g. "Row A - Cage 3", shown on the cage card
  type: CageType;
  status: CageStatus;
  /** Denormalized pointer to whichever rabbit currently occupies the cage
   *  (single-occupant cages). Kept in sync by Rabbit hooks. Null if empty. */
  currentRabbit?: Types.ObjectId | null;
  capacity: number;
  location?: string; // shed / row description
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICageOccupancyStats {
  totalCages: number;
  occupiedCages: number;
  totalCapacity: number;
  occupiedSlots: number;
  occupancyPct: number; // 0-100
  availableSlots: number;
}

interface ICageModel extends Model<ICage> {
  getOccupancyStats(userId: string): Promise<ICageOccupancyStats>;
}

const CageSchema = new Schema<ICage, ICageModel>(
  {
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(CageType), required: true },
    status: {
      type: String,
      enum: Object.values(CageStatus),
      default: CageStatus.EMPTY,
    },
    currentRabbit: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null },
    capacity: { type: Number, default: 1, min: 1 },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

CageSchema.plugin(tenantPlugin);

CageSchema.index({ userId: 1, label: 1 }, { unique: true });
CageSchema.index({ userId: 1, status: 1 });

/**
 * Occupancy numbers are derived directly from the Rabbit collection
 * (rabbit.cage) rather than from the denormalized Cage.status /
 * currentRabbit fields.
 *
 * Why: Cage.status is only kept in sync via the Rabbit document's
 * post-save hook, which does NOT fire on bulk operations (e.g. Sale's
 * `Rabbit.updateMany(...)` when a live rabbit is sold). That let sold
 * rabbits' cages stay marked "occupied" forever, silently inflating this
 * stat over time. Computing straight from live rabbit assignments makes
 * this self-healing regardless of what state the denormalized fields are
 * in, and guarantees `occupiedCages` and `occupiedSlots` always agree
 * with each other (both come from the same aggregation).
 */
CageSchema.statics.getOccupancyStats = async function (userId: string) {
  const [cageTotals, rabbitOccupancy] = await Promise.all([
    this.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCages: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
        },
      },
    ]),
    // Group active, currently-caged rabbits by cage so a cage only counts
    // as "occupied" if it actually holds a rabbit right now, and so
    // multi-occupant cages (capacity > 1) contribute their real headcount
    // toward occupiedSlots rather than their full capacity.
    model('Rabbit').aggregate([
      { $match: { userId, status: RabbitStatus.ACTIVE, cage: { $ne: null } } },
      { $group: { _id: '$cage', occupants: { $sum: 1 } } },
    ]),
  ]);

  const totalCages = cageTotals[0]?.totalCages ?? 0;
  const totalCapacity = cageTotals[0]?.totalCapacity ?? 0;

  const occupiedCages = rabbitOccupancy.length;
  const occupiedSlotsRaw = rabbitOccupancy.reduce(
    (sum: number, c: { occupants: number }) => sum + c.occupants,
    0
  );
  // Clamp in case of stale over-assignment (e.g. capacity was reduced
  // after rabbits were already placed) so the pct can never exceed 100%.
  const occupiedSlots = Math.min(occupiedSlotsRaw, totalCapacity);

  return {
    totalCages,
    occupiedCages,
    totalCapacity,
    occupiedSlots,
    occupancyPct: totalCapacity > 0 ? (occupiedSlots / totalCapacity) * 100 : 0,
    availableSlots: Math.max(0, totalCapacity - occupiedSlots),
  };
};

export const Cage = (models.Cage as ICageModel) || model<ICage, ICageModel>('Cage', CageSchema);
