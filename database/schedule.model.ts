import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISchedule extends Document {
  user_id: string | null;
  task_date: Date;
  task_type: string;
  rabbit_id: mongoose.Types.ObjectId | null;
  litter_id: mongoose.Types.ObjectId | null;
  notes: string | null;
  is_completed: boolean;
  is_alert: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleModel extends Model<ISchedule> {}
const scheduleSchema = new Schema<ISchedule, IScheduleModel>(
  {
    user_id: {
      type: String,
      default: null,
    },
    task_date: {
      type: Date,
      required: true,
    },
    task_type: {
      type: String,
      required: true,
      trim: true,
    },
    rabbit_id: {
      type: Schema.Types.ObjectId,
      ref: 'Rabbit',
      default: null,
    },
    litter_id: {
      type: Schema.Types.ObjectId,
      ref: 'Litter',
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
    is_alert: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Check for health-related repeat issues and set alert
scheduleSchema.pre('save', async function (next) {
  try {
    this.task_date = new Date(this.task_date.setUTCHours(0, 0, 0, 0));

    // For health-related tasks, check for repeat health records
    const healthRelatedTypes = ['vaccine', 'deworm', 'health check', 'treatment'];
    if (
      this.rabbit_id &&
      healthRelatedTypes.some((type) => this.task_type.toLowerCase().includes(type))
    ) {
      const HealthRecord = mongoose.model('HealthRecord');
      const repeatRecord = await HealthRecord.findOne({
        rabbit_id: this.rabbit_id,
        is_repeat: true,
      }).sort({ record_date: -1 });

      if (repeatRecord) {
        this.is_alert = true;
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes
scheduleSchema.index({ user_id: 1, task_date: 1 });
scheduleSchema.index({ rabbit_id: 1 });

// TTL index: Expire completed tasks after 90 days
scheduleSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 90 * 86400,
    partialFilterExpression: { is_completed: true },
  }
);

const Schedule = (mongoose.models.Schedule as IScheduleModel) || mongoose.model<ISchedule, IScheduleModel>('Schedule', scheduleSchema);

export default Schedule;
