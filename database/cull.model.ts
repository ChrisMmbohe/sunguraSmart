import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICull extends Document {
  rabbit_id: mongoose.Types.ObjectId;
  cull_date: Date;
  reason: string | null;
  destination: string | null;
  notes: string | null;
  user_id: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ICullModel extends Model<ICull> {}

const cullSchema = new Schema<ICull, ICullModel>(
  {
    rabbit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
      unique: true,
    },
    cull_date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    destination: {
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

// Pre-save: Update rabbit status to 'Culled' for status sync
cullSchema.pre('save', async function (next) {
  try {
    this.cull_date = new Date(this.cull_date.setUTCHours(0, 0, 0, 0));

    const Rabbit = mongoose.model('Rabbit');
    const rabbit = await Rabbit.findById(this.rabbit_id);

    if (!rabbit) throw new Error('Rabbit not found');

    // Sync status
    rabbit.status = 'Culled';
    await rabbit.save();

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
cullSchema.index({ rabbit_id: 1 });

const Cull = (mongoose.models.Cull as ICullModel) || mongoose.model<ICull, ICullModel>('Cull', cullSchema);

export default Cull;
