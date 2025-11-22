import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHealthRecord extends Document {
  rabbit_id: mongoose.Types.ObjectId;
  record_date: Date;
  disease_id: mongoose.Types.ObjectId | null;
  issue: string;
  treatment: string | null;
  medication: string | null;
  veterinarian: string | null;
  notes: string | null;
  user_id: string | null;
  is_repeat: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IHealthRecordModel extends Model<IHealthRecord> {
  getSickCount(userId: string): Promise<number>;
}

const healthRecordSchema = new Schema<IHealthRecord, IHealthRecordModel>(
  {
    rabbit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      required: true,
    },
    record_date: {
      type: Date,
      required: true,
    },
    disease_id: {
      type: Schema.Types.ObjectId,
      ref: 'Disease',
      default: null,
    },
    issue: {
      type: String,
      required: true,
    },
    treatment: {
      type: String,
      default: null,
    },
    medication: {
      type: String,
      default: null,
    },
    veterinarian: {
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
    is_repeat: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Detect repeat issues and validate rabbit is active
healthRecordSchema.pre('save', async function (next) {
  try {
    this.record_date = new Date(this.record_date.setUTCHours(0, 0, 0, 0));

    // Validate rabbit exists and is active
    const Rabbit = mongoose.model('Rabbit');
    const rabbit = await Rabbit.findById(this.rabbit_id);
    if (!rabbit) throw new Error('Rabbit not found');
    if (rabbit.status !== 'Active') {
      throw new Error('Cannot add health record for non-active rabbit');
    }

    // Check for similar prior health records for repeat detection
    if (this.isNew) {
      const HealthRecord = mongoose.model('HealthRecord');
      const priorRecord = await HealthRecord.findOne({
        rabbit_id: this.rabbit_id,
        issue: new RegExp(this.issue, 'i'),
        _id: { $ne: this._id },
      }).sort({ record_date: -1 });

      if (priorRecord) {
        this.is_repeat = true;
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static: Get count of sick rabbits for population dashboard
healthRecordSchema.statics.getSickCount = async function (userId: string): Promise<number> {
  const filter = userId ? { user_id: userId } : {};

  // Get unique rabbits with health records in the last 30 days (considered 'sick')
  const result = await this.aggregate([
    {
      $match: {
        ...filter,
        record_date: { $gte: new Date(Date.now() - 30 * 86400000) },
      },
    },
    { $group: { _id: '$rabbit_id' } },
    { $count: 'sick_count' },
  ]);

  return result[0]?.sick_count || 0;
};

// Indexes
healthRecordSchema.index({ rabbit_id: 1, record_date: -1 });

healthRecordSchema.set('toJSON', { virtuals: true });
healthRecordSchema.set('toObject', { virtuals: true });

const HealthRecord = (mongoose.models.HealthRecord as IHealthRecordModel) || mongoose.model<IHealthRecord, IHealthRecordModel>('HealthRecord', healthRecordSchema);

export default HealthRecord;
