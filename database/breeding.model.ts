import mongoose, { Schema, Document, Model } from 'mongoose';

type BreedingStatus = 'Planned' | 'Mated' | 'Failed';

export interface IBreeding extends Document {
  buck_id: mongoose.Types.ObjectId;
  doe_id: mongoose.Types.ObjectId;
  breeding_date: Date;
  expected_due_date: Date | null;
  notes: string | null;
  user_id: string | null;
  status: BreedingStatus;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  days_to_due: number;
}

export interface BreedingSuccessRate {
  total_breedings: number;
  successful: number;
  failed: number;
  success_rate: number;
}

export interface IBreedingModel extends Model<IBreeding> {
  getBreedingSuccess(userId: string): Promise<BreedingSuccessRate>;
}
const breedingSchema = new Schema<IBreeding, IBreedingModel>(
  {
    buck_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
    },
    doe_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
    },
    breeding_date: {
      type: Date,
      required: true,
    },
    expected_due_date: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    user_id: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Planned', 'Mated', 'Failed'],
      default: 'Planned',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Calculate due date, validate parents, update doe pregnancy status
breedingSchema.pre('save', async function (next) {
  try {
    // Normalize breeding_date to UTC midnight
    this.breeding_date = new Date(this.breeding_date.setUTCHours(0, 0, 0, 0));

    // Validate breeding_date <= today
    if (this.breeding_date > new Date()) {
      throw new Error('Breeding date cannot be in the future');
    }

    // Calculate expected_due_date (30 days after breeding)
    if (!this.expected_due_date || this.isModified('breeding_date')) {
      const dueDate = new Date(this.breeding_date);
      dueDate.setDate(dueDate.getDate() + 30);
      this.expected_due_date = dueDate;
    }

    // Validate buck and doe
    if (this.isNew || this.isModified('buck_id') || this.isModified('doe_id')) {
      if (this.buck_id.equals(this.doe_id)) {
        throw new Error('Buck and doe cannot be the same rabbit');
      }

      const Rabbit = mongoose.model('Rabbit');
      const [buck, doe] = await Promise.all([
        Rabbit.findById(this.buck_id),
        Rabbit.findById(this.doe_id),
      ]);

      if (!buck) throw new Error('Buck not found');
      if (!doe) throw new Error('Doe not found');

      // Business rules: gender, status, maturity checks
      if (buck.gender !== 'Male') throw new Error('Buck must be male');
      if (doe.gender !== 'Female') throw new Error('Doe must be female');
      if (buck.status !== 'Active') throw new Error('Buck must be active');
      if (doe.status !== 'Active') throw new Error('Doe must be active');

      // Check maturity (>= 112 days)
      const buckAge = buck.date_of_birth ? Math.floor((Date.now() - buck.date_of_birth.getTime()) / 86400000) : 0;
      const doeAge = doe.date_of_birth ? Math.floor((Date.now() - doe.date_of_birth.getTime()) / 86400000) : 0;

      if (buckAge < 112) throw new Error('Buck must be mature (>= 112 days old)');
      if (doeAge < 112) throw new Error('Doe must be mature (>= 112 days old)');
      if (doe.is_pregnant) throw new Error('Doe is already pregnant');

      // Update doe pregnancy status and last breeding date
      doe.is_pregnant = true;
      doe.last_breeding_date = this.breeding_date;
      await doe.save();
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Virtual: Days until due date
breedingSchema.virtual('days_to_due').get(function () {
  if (!this.expected_due_date) return 0;
  return Math.floor((this.expected_due_date.getTime() - Date.now()) / 86400000);
});

// Static: Calculate breeding success rate via litters
breedingSchema.statics.getBreedingSuccess = async function (userId: string): Promise<BreedingSuccessRate> {
  const filter = userId ? { user_id: userId } : {};

  const result = await this.aggregate([
    { $match: filter },
    {
      $facet: {
        total: [{ $count: 'count' }],
        by_status: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      },
    },
  ]);

  const total = result[0].total[0]?.count || 0;
  const statusMap = new Map(result[0].by_status.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const successful = statusMap.get('Mated') || 0;
  const failed = statusMap.get('Failed') || 0;

  return {
    total_breedings: total,
    successful,
    failed,
    success_rate: total > 0 ? (successful / total) * 100 : 0,
  };
};

// Indexes
breedingSchema.index({ buck_id: 1 });
breedingSchema.index({ doe_id: 1 });
breedingSchema.index({ user_id: 1, breeding_date: -1 });

breedingSchema.set('toJSON', { virtuals: true });
breedingSchema.set('toObject', { virtuals: true });

const Breeding = (mongoose.models.Breeding as IBreedingModel) || mongoose.model<IBreeding, IBreedingModel>('Breeding', breedingSchema);

export default Breeding;
