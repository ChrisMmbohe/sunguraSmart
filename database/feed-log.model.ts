import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeedLog extends Document {
  feed_type_id: mongoose.Types.ObjectId;
  date: Date;
  quantity_used: number;
  rabbits_covered: number | null;
  notes: string | null;
  user_id: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyConsumption {
  feed_type: string;
  total_used: number;
  recommended: number;
  variance: number;
}

export interface IFeedLogModel extends Model<IFeedLog> {
  getMonthlyConsumption(userId: string): Promise<MonthlyConsumption[]>;
}
const feedLogSchema = new Schema<IFeedLog, IFeedLogModel>(
  {
    feed_type_id: {
      type: Schema.Types.ObjectId,
      ref: 'FeedType',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    quantity_used: {
      type: Number,
      required: true,
      min: 0,
    },
    rabbits_covered: {
      type: Number,
      default: null,
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

// Pre-save: Validate quantity and suggest based on population
feedLogSchema.pre('save', async function (next) {
  try {
    if (this.quantity_used <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    this.date = new Date(this.date.setUTCHours(0, 0, 0, 0));

    // Validate feed type exists
    if (this.isNew || this.isModified('feed_type_id')) {
      const FeedType = mongoose.model('FeedType');
      const feedType = await FeedType.findById(this.feed_type_id);
      if (!feedType) throw new Error('Feed type not found');
    }

    // Auto-populate rabbits_covered if not set (based on active population)
    if (!this.rabbits_covered && this.user_id) {
      const Rabbit = mongoose.model('Rabbit');
      const activeCount = await Rabbit.countDocuments({
        user_id: this.user_id,
        status: 'Active',
      });
      this.rabbits_covered = activeCount;
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static: Calculate monthly consumption vs recommendations for finance integration
feedLogSchema.statics.getMonthlyConsumption = async function (userId: string): Promise<MonthlyConsumption[]> {
  const filter = userId ? { user_id: userId } : {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const result = await this.aggregate([
    { $match: { ...filter, date: { $gte: thirtyDaysAgo } } },
    {
      $lookup: {
        from: 'feedtypes',
        localField: 'feed_type_id',
        foreignField: '_id',
        as: 'feed_type',
      },
    },
    { $unwind: '$feed_type' },
    {
      $group: {
        _id: '$feed_type_id',
        feed_type: { $first: '$feed_type.name' },
        total_used: { $sum: '$quantity_used' },
        avg_rabbits: { $avg: '$rabbits_covered' },
        daily_recommendation: { $first: '$feed_type.daily_recommendation_per_rabbit' },
      },
    },
    {
      $project: {
        feed_type: 1,
        total_used: 1,
        recommended: {
          $multiply: ['$daily_recommendation', '$avg_rabbits', 30],
        },
        variance: {
          $subtract: [
            '$total_used',
            { $multiply: ['$daily_recommendation', '$avg_rabbits', 30] },
          ],
        },
      },
    },
  ]);

  return result;
};

// Indexes
feedLogSchema.index({ user_id: 1, date: -1 });
feedLogSchema.index({ feed_type_id: 1 });

const FeedLog = (mongoose.models.FeedLog as IFeedLogModel) || mongoose.model<IFeedLog, IFeedLogModel>('FeedLog', feedLogSchema);

export default FeedLog;
