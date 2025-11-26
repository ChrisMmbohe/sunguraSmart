import mongoose, { Schema, Document, Model } from 'mongoose';

type BreedingStatus = 'Planned' | 'Mated' | 'Kindled' | 'Failed';

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

export interface CumulativeBreedingSuccessRate {
  total_breedings_attempted: number;
  kindled_litters: number;
  weaned_litters: number;
  kindling_rate_pct: number;
  weaning_survival_rate_pct: number;
}

export interface IBreedingModel extends Model<IBreeding> {
  getBreedingSuccess(userId: string): Promise<CumulativeBreedingSuccessRate>; 
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
      enum: ['Planned', 'Mated', 'Kindled', 'Failed'],
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
    this.breeding_date = new Date(this.breeding_date.setUTCHours(0, 0, 0, 0));

    if (this.breeding_date > new Date()) {
      throw new Error('Breeding date cannot be in the future');
    }

    if (!this.expected_due_date || this.isModified('breeding_date')) {
      const dueDate = new Date(this.breeding_date);
      dueDate.setDate(dueDate.getDate() + 30);
      this.expected_due_date = dueDate;
    }

    // --- State Check and Initial Setup for New Records ---
    if (this.isNew || this.isModified('buck_id') || this.isModified('doe_id')) {
      if (this.buck_id.equals(this.doe_id)) {
        throw new Error('Buck and doe cannot be the same rabbit');
      }

      const Rabbit = mongoose.model('Rabbit');
      // Fetch for basic validation (gender, status, age)
      const [buck, doe] = await Promise.all([
        Rabbit.findById(this.buck_id),
        Rabbit.findById(this.doe_id),
      ]);

      if (!buck) throw new Error('Buck not found');
      if (!doe) throw new Error('Doe not found');

      if (buck.gender !== 'Male') throw new Error('Buck must be male');
      if (doe.gender !== 'Female') throw new Error('Doe must be female');
      if (buck.status !== 'Active') throw new Error('Buck must be active');
      if (doe.status !== 'Active') throw new Error('Doe must be active');

      const buckAge = buck.date_of_birth ? Math.floor((Date.now() - buck.date_of_birth.getTime()) / 86400000) : 0;
      const doeAge = doe.date_of_birth ? Math.floor((Date.now() - doe.date_of_birth.getTime()) / 86400000) : 0;

      if (buckAge < 112) throw new Error('Buck must be mature (>= 112 days old)');
      if (doeAge < 112) throw new Error('Doe must be mature (>= 112 days old)');
    }
    
    // ------------------------------------------------------------------
    // ✅ FIX: Atomic Pregnancy/Status Update Logic (Prevents Race Condition)
    // ------------------------------------------------------------------
    const Rabbit = mongoose.model('Rabbit');

    if (this.isNew || this.isModified('status')) {
      if (this.status === 'Mated') {
        // CRITICAL ATOMIC UPDATE: Only update to pregnant if is_pregnant is currently false.
        const updated = await Rabbit.findOneAndUpdate(
          { _id: this.doe_id, is_pregnant: false },
          { 
            is_pregnant: true, 
            last_breeding_date: this.breeding_date 
          },
          // new: true is optional as we only need success/fail, runValidators: false is key
          { new: true, runValidators: false } 
        );

        if (!updated) {
          // If updated is null, it means the condition { is_pregnant: false } was not met.
          // This prevents the TOCTOU race condition.
          throw new Error('Cannot create a Mated breeding for a doe that is already pregnant.');
        }
      } else if (this.status === 'Kindled' || this.status === 'Failed') {
        // Clear pregnancy flag when breeding is completed or failed
        const updateFields: any = { is_pregnant: false };
        if (this.status === 'Failed') {
          updateFields.last_breeding_date = null;
        }

        // Use findOneAndUpdate to clear the flag in a single atomic operation
        await Rabbit.findOneAndUpdate(
          { _id: this.doe_id },
          { $set: updateFields },
          { runValidators: false }
        );
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

breedingSchema.virtual('days_to_due').get(function () {
  if (!this.expected_due_date) return 0;
  return Math.floor((this.expected_due_date.getTime() - Date.now()) / 86400000);
});

breedingSchema.statics.getBreedingSuccess = async function (userId: string): Promise<CumulativeBreedingSuccessRate> {
  // Only consider 'Mated', 'Kindled', 'Failed' status records for calculations of success rates
  const filter = userId ? 
    { user_id: userId, status: { $in: ['Mated', 'Kindled', 'Failed'] } } : 
    { status: { $in: ['Mated', 'Kindled', 'Failed'] } }; 

  const results = await this.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'litters',
        localField: '_id',
        foreignField: 'breeding_id',
        as: 'litter_data',
      },
    },
    // Unwind must happen *before* grouping the counters
    { $unwind: { path: '$litter_data', preserveNullAndEmptyArrays: true } }, 
    {
      $group: {
        _id: null,
        // FIX: Use $addToSet to gather unique Breeding IDs before counting.
        total_breedings_attempted: { $addToSet: '$_id' }, 
        kindled_litters: {
          // Litters that have a kindling date
          $sum: {
            $cond: [{ $ne: ['$litter_data.kindling_date', null] }, 1, 0] 
          },
        },
        weaned_litters: {
          // Litters that had at least one kit survive to weaning
          $sum: {
            $cond: [{ $gt: ['$litter_data.num_kits_weaned', 0] }, 1, 0] 
          },
        },
      },
    },
    // FIX: Project the size of the unique set to get the true count
    {
      $project: {
        total_breedings_attempted: { $size: '$total_breedings_attempted' },
        kindled_litters: 1,
        weaned_litters: 1,
      },
    },
  ]);

  const data = results[0] || {};
  const total = data.total_breedings_attempted || 0;
  const kindled = data.kindled_litters || 0;
  const weaned = data.weaned_litters || 0;

  let kindling_rate_pct = 0;
  let weaning_survival_rate_pct = 0;

  if (total > 0) {
      // Kindling Rate: (Kindled Litters / Total Breedings) * 100
      kindling_rate_pct = (kindled / total) * 100;
  }

  // Corrected Weaning Survival Rate: (Weaned Litters / Kindled Litters) * 100
  // Checks 'kindled' to avoid division by zero.
  if (kindled > 0) {
      weaning_survival_rate_pct = (weaned / kindled) * 100;
  }
  
  return {
    total_breedings_attempted: total,
    kindled_litters: kindled,
    weaned_litters: weaned,
    kindling_rate_pct: parseFloat(kindling_rate_pct.toFixed(2)),
    weaning_survival_rate_pct: parseFloat(weaning_survival_rate_pct.toFixed(2)), 
  };
};

breedingSchema.index({ buck_id: 1 });
breedingSchema.index({ doe_id: 1 });
breedingSchema.index({ user_id: 1, breeding_date: -1 });

breedingSchema.set('toJSON', { virtuals: true });
breedingSchema.set('toObject', { virtuals: true });

const Breeding = (mongoose.models.Breeding as IBreedingModel) || mongoose.model<IBreeding, IBreedingModel>('Breeding', breedingSchema);

export default Breeding;