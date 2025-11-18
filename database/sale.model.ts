import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISale extends Document {
  rabbit_id: mongoose.Types.ObjectId;
  sale_date: Date;
  sale_price: number;
  buyer_name: string | null;
  buyer_contact: string | null;
  notes: string | null;
  user_id: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ISaleModel extends Model<ISale> {
  getTotalIncome(userId: string, period: { start: Date; end: Date }): Promise<number>;
}

const saleSchema = new Schema<ISale, ISaleModel>(
  {
    rabbit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
      unique: true,
    },
    sale_date: {
      type: Date,
      required: true,
    },
    sale_price: {
      type: Number,
      required: true,
      min: 0,
    },
    buyer_name: {
      type: String,
      default: null,
    },
    buyer_contact: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

// Pre-save: Update rabbit status to 'Sold' and validate price
saleSchema.pre('save', async function (next) {
  try {
    if (this.sale_price <= 0) {
      throw new Error('Sale price must be greater than 0');
    }

    this.sale_date = new Date(this.sale_date.setUTCHours(0, 0, 0, 0));

    const Rabbit = mongoose.model('Rabbit');
    const rabbit = await Rabbit.findById(this.rabbit_id);

    if (!rabbit) throw new Error('Rabbit not found');

    rabbit.status = 'Sold';
    await rabbit.save();

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static: Calculate total income for finance aggregation
saleSchema.statics.getTotalIncome = async function (
  userId: string,
  period: { start: Date; end: Date }
): Promise<number> {
  const filter: Record<string, unknown> = {
    sale_date: { $gte: period.start, $lte: period.end },
  };

  if (userId) {
    filter.user_id = userId;
  }

  const result = await this.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$sale_price' } } },
  ]);

  return result[0]?.total || 0;
};

// Indexes
saleSchema.index({ rabbit_id: 1 });
saleSchema.index({ user_id: 1, sale_date: -1 });

const Sale = (mongoose.models.Sale as ISaleModel) || mongoose.model<ISale, ISaleModel>('Sale', saleSchema);

export default Sale;
