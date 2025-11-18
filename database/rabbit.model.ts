import mongoose, { Schema, Document, Model } from 'mongoose';

type Gender = 'Male' | 'Female';
type AcquisitionType = 'born' | 'purchased' | 'gift' | 'other' | null;
type Status = 'Active' | 'Sold' | 'Deceased' | 'Culled';
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
  last_breeding_date: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  age_in_days: number;
  maturity_status: MaturityStatus;
  is_mature: boolean;
  full_name: string;
  daily_feed_needed: { pellets: number; hay: number };
}

export interface PopulationStats {
  total: number;
  male: number;
  female: number;
  active: number;
  deceased: number;
  sold: number;
  culled: number;
  sick: number;
  pregnant: number;
  mature: number;
  by_breed: Array<{ breed: string; count: number }>;
}
export interface IRabbitModel extends Model<IRabbit> {
  getPopulationStats(userId: string): Promise<PopulationStats>;
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
      default: null,
    },
    acquisition_type: {
      type: String,
      enum: ['born', 'purchased', 'gift', 'other', null],
      default: null,
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
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Sold', 'Deceased', 'Culled'],
      default: 'Active',
      required: true,
    },
    is_pregnant: {
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
  }
);

// Pre-save validation and business rules enforcement
rabbitSchema.pre('save', async function (next) {
  try {
    // Normalize dates to UTC midnight
    if (this.date_of_birth) {
      this.date_of_birth = new Date(this.date_of_birth.setUTCHours(0, 0, 0, 0));
    }
    if (this.acquisition_date) {
      this.acquisition_date = new Date(this.acquisition_date.setUTCHours(0, 0, 0, 0));
    }

    // Enforce: is_pregnant only for females
    if (this.gender !== 'Female' && this.is_pregnant) {
      throw new Error('Only female rabbits can be pregnant');
    }

    // Validate: sire_id !== _id (rabbit cannot be its own parent)
    if (this.sire_id && this.sire_id.equals(this._id)) {
      throw new Error('Rabbit cannot be its own sire');
    }
    if (this.dam_id && this.dam_id.equals(this._id)) {
      throw new Error('Rabbit cannot be its own dam');
    }

    // If acquisition_type is 'born', require sire_id and dam_id
    if (this.acquisition_type === 'born') {
      if (!this.sire_id || !this.dam_id) {
        throw new Error('Born rabbits must have both sire_id and dam_id');
      }

      // Validate parents exist
      if (this.isNew || this.isModified('sire_id') || this.isModified('dam_id')) {
        const Rabbit = mongoose.model('Rabbit');
        const [sire, dam] = await Promise.all([
          Rabbit.findById(this.sire_id),
          Rabbit.findById(this.dam_id),
        ]);

        if (!sire) throw new Error('Sire not found');
        if (!dam) throw new Error('Dam not found');
        if (sire.gender !== 'Male') throw new Error('Sire must be male');
        if (dam.gender !== 'Female') throw new Error('Dam must be female');
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Virtual: Calculate age in days
rabbitSchema.virtual('age_in_days').get(function () {
  if (!this.date_of_birth) return 0;
  return Math.floor((Date.now() - this.date_of_birth.getTime()) / 86400000);
});

// Virtual: Maturity status based on age
rabbitSchema.virtual('maturity_status').get(function (): MaturityStatus {
  const age = this.age_in_days;
  if (age <= 56) return 'Kit';
  if (age <= 112) return 'Junior';
  if (age <= 365) return 'Adult';
  return 'Senior';
});

// Virtual: Is mature (>= 112 days / ~16 weeks)
rabbitSchema.virtual('is_mature').get(function () {
  return this.age_in_days >= 112;
});

// Virtual: Full name fallback to tag_id
rabbitSchema.virtual('full_name').get(function () {
  return this.name || this.tag_id;
});

// Virtual: Daily feed requirements for feed management
rabbitSchema.virtual('daily_feed_needed').get(function () {
  return {
    pellets: 100, // grams per day
    hay: 1 / 14, // 1 bale per 2 weeks = 0.071 bale/day
  };
});

// Static: Aggregate population statistics for dashboard efficiency
rabbitSchema.statics.getPopulationStats = async function (userId: string): Promise<PopulationStats> {
  const filter = userId ? { user_id: userId } : {};

  const [counts, breedCounts] = await Promise.all([
    this.aggregate([
      { $match: filter },
      {
        $facet: {
          total: [{ $count: 'count' }],
          by_gender: [{ $group: { _id: '$gender', count: { $sum: 1 } } }],
          by_status: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          pregnant: [{ $match: { is_pregnant: true } }, { $count: 'count' }],
          mature: [
            {
              $match: {
                date_of_birth: { $lte: new Date(Date.now() - 112 * 86400000) },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]),
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$breed_id', count: { $sum: 1 } } },
      { $lookup: { from: 'breeds', localField: '_id', foreignField: '_id', as: 'breed' } },
      { $unwind: { path: '$breed', preserveNullAndEmptyArrays: true } },
      { $project: { breed: { $ifNull: ['$breed.name', 'Unknown'] }, count: 1 } },
    ]),
  ]);

  const result = counts[0];
  const genderMap = new Map(result.by_gender.map((g: { _id: string; count: number }) => [g._id, g.count]));
  const statusMap = new Map(result.by_status.map((s: { _id: string; count: number }) => [s._id, s.count]));

  return {
    total: result.total[0]?.count || 0,
    male: genderMap.get('Male') || 0,
    female: genderMap.get('Female') || 0,
    active: statusMap.get('Active') || 0,
    deceased: statusMap.get('Deceased') || 0,
    sold: statusMap.get('Sold') || 0,
    culled: statusMap.get('Culled') || 0,
    sick: 0, // Populated via HealthRecord aggregation
    pregnant: result.pregnant[0]?.count || 0,
    mature: result.mature[0]?.count || 0,
    by_breed: breedCounts,
  };
};

// Indexes for query optimization
rabbitSchema.index({ tag_id: 1 });
rabbitSchema.index({ user_id: 1, status: 1, gender: 1 });
rabbitSchema.index({ user_id: 1, status: 1, gender: 1 });rabbitSchema.index({ is_pregnant: 1 }, { sparse: true });
rabbitSchema.index({ date_of_birth: -1 });

rabbitSchema.set('toJSON', { virtuals: true });
rabbitSchema.set('toObject', { virtuals: true });

const Rabbit = (mongoose.models.Rabbit as IRabbitModel) || mongoose.model<IRabbit, IRabbitModel>('Rabbit', rabbitSchema);

export default Rabbit;
