import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWeight extends Document {
  rabbit_id: mongoose.Types.ObjectId;
  measurement_date: Date;
  weight_kg: number;
  notes: string | null;
  user_id: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  growth_rate: number | null;
}

interface AverageGrowth {
  breed_id: string;
  breed_name: string;
  average_weight: number;
  average_growth_rate: number;
}

interface IWeightModel extends Model<IWeight> {
  getAverageGrowth(breedId: string): Promise<AverageGrowth>;
}

const weightSchema = new Schema<IWeight, IWeightModel>(
  {
    rabbit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
    },
    measurement_date: {
      type: Date,
      required: true,
    },
    weight_kg: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: null,
    },
    user_id: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Validate weight and rabbit existence
weightSchema.pre('save', async function (next) {
  try {
    if (this.weight_kg <= 0) {
      throw new Error('Weight must be greater than 0');
    }

    this.measurement_date = new Date(this.measurement_date.setUTCHours(0, 0, 0, 0));

    // Validate rabbit exists
    if (this.isNew || this.isModified('rabbit_id')) {
      const Rabbit = mongoose.model('Rabbit');
      const rabbit = await Rabbit.findById(this.rabbit_id);
      if (!rabbit) throw new Error('Rabbit not found');
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Virtual: Growth rate compared to previous weight (placeholder - calculate via query)
weightSchema.virtual('growth_rate').get(function () {
  // Placeholder - implement via aggregation in routes/controllers
  // Query previous weight and calculate: (current - previous) / days_elapsed
  return null;
});

// Static: Calculate average growth by breed for feed efficiency analysis
weightSchema.statics.getAverageGrowth = async function (breedId: string): Promise<AverageGrowth> {
  const result = await this.aggregate([
    {
      $lookup: {
        from: 'rabbits',
        localField: 'rabbit_id',
        foreignField: '_id',
        as: 'rabbit',
      },
    },
    { $unwind: '$rabbit' },
    { $match: { 'rabbit.breed_id': new mongoose.Types.ObjectId(breedId) } },
    {
      $group: {
        _id: '$rabbit.breed_id',
        average_weight: { $avg: '$weight_kg' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'breeds',
        localField: '_id',
        foreignField: '_id',
        as: 'breed',
      },
    },
    { $unwind: '$breed' },
    {
      $project: {
        breed_id: { $toString: '$_id' },
        breed_name: '$breed.name',
        average_weight: 1,
        average_growth_rate: 0, // Placeholder for detailed calculation
      },
    },
  ]);

  return result[0] || { breed_id: breedId, breed_name: 'Unknown', average_weight: 0, average_growth_rate: 0 };
};

// Indexes
weightSchema.index({ rabbit_id: 1, measurement_date: -1 });

weightSchema.set('toJSON', { virtuals: true });
weightSchema.set('toObject', { virtuals: true });

const Weight = (mongoose.models.Weight as IWeightModel) || mongoose.model<IWeight, IWeightModel>('Weight', weightSchema);

export default Weight;
