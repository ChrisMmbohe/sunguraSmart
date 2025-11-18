import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeath extends Document {
  rabbit_id: mongoose.Types.ObjectId;
  death_date: Date;
  cause: string | null;
  notes: string | null;
  user_id: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IDeathModel extends Model<IDeath> {}

const deathSchema = new Schema<IDeath, IDeathModel>(
  {
    rabbit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
      unique: true,
    },
    death_date: {
      type: Date,
      required: true,
    },
    cause: {
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

// Pre-save: Update rabbit status to 'Deceased' for population tracking
deathSchema.pre('save', async function (next) {
  try {
    this.death_date.setUTCHours(0, 0, 0, 0);
    const Rabbit = mongoose.model('Rabbit');
    const rabbit = await Rabbit.findById(this.rabbit_id);

    if (!rabbit) throw new Error('Rabbit not found');

    // Sync status for population stats
    rabbit.status = 'Deceased';
    await rabbit.save();

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
deathSchema.index({ rabbit_id: 1 });

const Death = (mongoose.models.Death as IDeathModel) || mongoose.model<IDeath, IDeathModel>('Death', deathSchema);

export default Death;
