import mongoose, { Schema, Document, Model } from 'mongoose';

type Gender = 'Male' | 'Female';
type AcquisitionType = 'born' | 'purchased' | 'gift' | 'other' | null;
// Updated Status type to include 'Quarantined'
type Status = 'Active' | 'Sold' | 'Deceased' | 'Culled' | 'Quarantined';
type MaturityStatus = 'Kit' | 'Junior' | 'Adult' | 'Senior';

export interface IRabbit extends Document {
  tag_id: string;
  name: string | null;
  breed_id: mongoose.Types.ObjectId | null;
  gender: Gender;
  date_of_birth: Date | null;
  acquisition_date: Date | null;
  acquisition_type: AcquisitionType;
  source_farm: string | null;
  cage_id: mongoose.Types.ObjectId | null;
  photo: string | null;
  color: string | null;
  category: string | null;
  notes: string | null;
  sire_id: mongoose.Types.ObjectId | null;
  dam_id: mongoose.Types.ObjectId | null;
  user_id: string | null;
  status: Status;
  is_pregnant: boolean;
  is_quarantined: boolean; // New field for quarantine status
  last_breeding_date: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  age_in_days: number;
  maturity_status: MaturityStatus;
  full_name: string;
}

// Define the structure for the aggregated dashboard statistics
export interface RabbitStats {
  total: number;
  male: number;
  female: number;
  active: number;
  deceased: number;
  sold: number;
  culled: number;
  sick: number; // Placeholder, usually populated via HealthRecord aggregation
  pregnant: number;
  quarantined: number; // New quarantine count
  mature: number;
  by_breed: { _id: mongoose.Types.ObjectId | null; name: string; count: number }[];
}

export interface IRabbitModel extends Model<IRabbit> {
  getStats(userId: string): Promise<RabbitStats>;
}

const rabbitSchema = new Schema<IRabbit, IRabbitModel>(
  {
    tag_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      default: null,
      trim: true,
    },
    breed_id: {
      type: Schema.Types.ObjectId,
      ref: 'Breed',
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    acquisition_date: {
      type: Date,
      default: Date.now,
    },
    acquisition_type: {
      type: String,
      enum: ['born', 'purchased', 'gift', 'other', null],
      default: 'purchased',
    },
    source_farm: {
      type: String,
      default: null,
    },
    cage_id: {
      type: Schema.Types.ObjectId,
      ref: 'Cage',
      default: null,
    },
    photo: {
      type: String,
      default: null,
    },
    color: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    sire_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      default: null,
    },
    dam_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      default: null,
    },
    user_id: {
      type: String,
      required: true, // Must be linked to a Clerk user
    },
    status: {
      type: String,
      enum: ['Active', 'Sold', 'Deceased', 'Culled', 'Quarantined'], // Added Quarantined
      default: 'Active',
    },
    is_pregnant: {
      type: Boolean,
      default: false,
    },
    is_quarantined: { // New field
      type: Boolean,
      default: false,
    },
    last_breeding_date: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ──────────────────────────────────────────────────────
// PRE-SAVE HOOK
// ──────────────────────────────────────────────────────
rabbitSchema.pre('save', function (next) {
  // If the rabbit is being sold/culled/deceased, clear pregnancy/quarantine flags
  if (['Sold', 'Deceased', 'Culled'].includes(this.status) && this.isModified('status')) {
    this.is_pregnant = false;
    this.is_quarantined = false;
  }

  // Set default name if none is provided
  if (this.isNew && !this.name) {
    this.name = this.tag_id;
  }
  
  // ──────────────────────────────────────────────────────
  // CRITICAL QUARANTINE LOGIC
  // ──────────────────────────────────────────────────────
  
  // 1. Prevent quarantine on final statuses
  const finalStatuses: Status[] = ['Sold', 'Deceased', 'Culled'];
  if (this.is_quarantined && finalStatuses.includes(this.status)) {
    return next(new Error('Cannot quarantine a rabbit with a final status (Sold/Deceased/Culled)'));
  }
  
  // 2. Sync status with quarantine flag (only for 'Active' state)
  if (this.isModified('is_quarantined')) {
    if (this.is_quarantined && this.status === 'Active') {
      // Transition from Active to Quarantined
      this.status = 'Quarantined';
    } else if (!this.is_quarantined && this.status === 'Quarantined') {
      // Transition from Quarantined back to Active
      this.status = 'Active';
    }
    // If is_quarantined is set to true when status is already 'Quarantined', no change
    // If is_quarantined is set to false when status is 'Active', no change
  }
  
  // 3. Sync quarantine flag with status
  if (this.isModified('status')) {
    if (this.status === 'Quarantined' && !this.is_quarantined) {
      // Status was manually set to 'Quarantined', sync flag
      this.is_quarantined = true;
    } else if (this.status === 'Active' && this.is_quarantined) {
      // Status was manually set to 'Active', sync flag
      this.is_quarantined = false;
    }
  }

  // ──────────────────────────────────────────────────────
  // End Quarantine Logic
  // ──────────────────────────────────────────────────────

  next();
});

// ──────────────────────────────────────────────────────
// VIRTUALS
// ──────────────────────────────────────────────────────

// Full Name Virtual
rabbitSchema.virtual('full_name').get(function () {
  return this.name || this.tag_id;
});

// Age Virtual
rabbitSchema.virtual('age_in_days').get(function () {
  if (!this.date_of_birth) return 0;
  // Calculate age in days
  const diffTime = Math.abs(Date.now() - this.date_of_birth.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Maturity Status Virtual
rabbitSchema.virtual('maturity_status').get(function (this: IRabbit) {
  const age = this.age_in_days;

  if (age <= 0) return 'Kit'; // Default for no DOB
  if (age < 56) return 'Kit'; // ~8 weeks
  if (age < 112) return 'Junior'; // ~16 weeks (4 months)
  // If the rabbit is older than 4 months
  if (age < 182) return 'Adult'; // ~6 months
  return 'Senior'; // > 6 months
});

// ──────────────────────────────────────────────────────
// STATICS (getStats)
// ──────────────────────────────────────────────────────

/**
 * Calculates key statistics for a user's rabbitry.
 */
rabbitSchema.statics.getStats = async function (userId: string): Promise<RabbitStats> {
  const filter = { user_id: userId };

  // Run all aggregations concurrently
  const [counts, breedCounts] = await Promise.all([
    this.aggregate([
      { $match: filter },
      {
        $facet: {
          total: [{ $count: 'count' }],
          by_gender: [{ $group: { _id: '$gender', count: { $count: {} } } }],
          by_status: [{ $group: { _id: '$status', count: { $count: {} } } }],
          pregnant: [{ $match: { is_pregnant: true } }, { $count: 'count' }],
          quarantined: [{ $match: { is_quarantined: true } }, { $count: 'count' }], // New stat
          // Calculate 'mature' based on a minimum age (e.g., 112 days or ~4 months)
          mature: [{ $match: { date_of_birth: { $lte: new Date(Date.now() - 112 * 24 * 60 * 60 * 1000) } } }, { $count: 'count' }],
        }
      },
    ]),
    // Separate aggregation to handle $lookup for breed names
    this.aggregate([
      { $match: filter },
      // Exclude Quarantined rabbits from 'Active' count calculation (optional, as status handles this)
      { $match: { status: { $ne: 'Quarantined' } } }, 
      { $group: { _id: '$breed_id', count: { $count: {} } } },
      { $lookup: { from: 'breeds', localField: '_id', foreignField: '_id', as: 'breed_data' } },
      { $unwind: { path: '$breed_data', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, name: { $ifNull: ['$breed_data.name', 'Unknown'] } } },
      { $sort: { count: -1, name: 1 } },
      { $project: { _id: 1, count: 1, name: { $ifNull: ['$breed_data.name', 'Unknown'] } } },
    ]),
  ]);

  const result = counts[0];
  const genderMap = new Map(result.by_gender.map((g: { _id: string; count: number }) => [g._id, g.count]));
  const statusMap = new Map(result.by_status.map((s: { _id: string; count: number }) => [s._id, s.count]));

  return {
    total: result.total[0]?.count || 0,
    male: genderMap.get('Male') || 0,
    female: genderMap.get('Female') || 0,
    // Active status now correctly excludes Quarantined rabbits via the model's enum rules,
    // so we can rely on the status map here.
    active: statusMap.get('Active') || 0,
    deceased: statusMap.get('Deceased') || 0,
    sold: statusMap.get('Sold') || 0,
    culled: statusMap.get('Culled') || 0,
    sick: 0, // Placeholder, usually populated via HealthRecord aggregation
    pregnant: result.pregnant[0]?.count || 0,
    quarantined: result.quarantined[0]?.count || 0, // Populate the new stat
    mature: result.mature[0]?.count || 0,
    by_breed: breedCounts,
  };
};

// Indexes for query optimization
rabbitSchema.index({ user_id: 1, status: 1, gender: 1 });
rabbitSchema.index({ breed_id: 1 });
rabbitSchema.index({ cage_id: 1 });

// Redundant virtual configuration removed here:
// rabbitSchema.set('toJSON', { virtuals: true });
// rabbitSchema.set('toObject', { virtuals: true });

const Rabbit = (mongoose.models.Rabbit as IRabbitModel) ||
  mongoose.model<IRabbit, IRabbitModel>('Rabbit', rabbitSchema);

export default Rabbit;