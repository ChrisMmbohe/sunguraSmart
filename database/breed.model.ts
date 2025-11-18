import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for type safety
export interface IBreed extends Document {
  name: string;
  description: string | null;
  average_weight_kg: number | null;
  breed_colors: string[];
  recommended_feed: string | null;
  maturity_age_days: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  is_meat_breed: boolean;
}

// Static methods interface
interface IBreedModel extends Model<IBreed> {
  getByCharacteristics(query: { weight?: number }): Promise<IBreed[]>;
}

const breedSchema = new Schema<IBreed, IBreedModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    average_weight_kg: {
      type: Number,
      default: null,
      min: 0,
    },
    breed_colors: {
      type: [String],
      default: [],
    },
    recommended_feed: {
      type: String,
      default: null,
    },
    maturity_age_days: {
      type: Number,
      default: 112, // ~16 weeks
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize name to lowercase for efficient uniqueness and search
breedSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase();
  }
  next();
});

// Virtual: Classify as meat breed if average weight > 4kg
breedSchema.virtual('is_meat_breed').get(function () {
  return this.average_weight_kg !== null && this.average_weight_kg > 4;
});

// Static: Filter breeds by characteristics
breedSchema.statics.getByCharacteristics = async function (query: { weight?: number }) {
  const filter: Record<string, unknown> = {};
  
  if (query.weight !== undefined) {
    filter.average_weight_kg = { $gte: query.weight };
  }
  
  return this.find(filter).exec();
};

// Indexes for efficient queries
breedSchema.index({ name: 1 });

// Ensure virtuals are included in JSON
breedSchema.set('toJSON', { virtuals: true });
breedSchema.set('toObject', { virtuals: true });

const Breed = (mongoose.models.Breed as IBreedModel) || mongoose.model<IBreed, IBreedModel>('Breed', breedSchema);

export default Breed;
