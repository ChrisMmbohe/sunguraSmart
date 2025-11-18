import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeedType extends Document {
  name: string;
  unit: string;
  daily_recommendation_per_rabbit: number;
  frequency: string | null;
  cost_per_unit: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  weekly_need_per_rabbit: number;
}

interface IFeedTypeModel extends Model<IFeedType> {}

const feedTypeSchema = new Schema<IFeedType, IFeedTypeModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    daily_recommendation_per_rabbit: {
      type: Number,
      default: 100, // grams for pellets
      min: 0,
    },
    frequency: {
      type: String,
      default: null,
    },
    cost_per_unit: {
      type: Number,
      default: null,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: Calculate weekly need per rabbit based on daily recommendation
feedTypeSchema.virtual('weekly_need_per_rabbit').get(function () {
  // Parse frequency to calculate weekly need
  if (this.frequency && this.frequency.toLowerCase().includes('week')) {
    const match = this.frequency.match(/(\d+)/);
    if (match) {
      const weeksInterval = parseInt(match[0], 10);
      return this.daily_recommendation_per_rabbit / (7 * weeksInterval);
    }
  }
  // Default: daily * 7
  return this.daily_recommendation_per_rabbit * 7;
});

// Indexes
feedTypeSchema.index({ name: 1 });

feedTypeSchema.set('toJSON', { virtuals: true });
feedTypeSchema.set('toObject', { virtuals: true });

const FeedType = (mongoose.models.FeedType as IFeedTypeModel) || mongoose.model<IFeedType, IFeedTypeModel>('FeedType', feedTypeSchema);

export default FeedType;
