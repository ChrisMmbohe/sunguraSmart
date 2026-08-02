import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { Rabbit } from './Rabbit_model';
import { round2 } from '../utils/ownership.util';

export interface IWeightLog extends Document, ITenantFields {
  _id: Types.ObjectId;
  rabbit: Types.ObjectId;
  weightKg: number;
  recordedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IWeightLogModel extends Model<IWeightLog> {}

const WeightLogSchema = new Schema<IWeightLog, IWeightLogModel>(
  {
    rabbit: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    weightKg: { type: Number, required: true, min: 0 },
    recordedAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

WeightLogSchema.plugin(tenantPlugin);

WeightLogSchema.index({ userId: 1, rabbit: 1, recordedAt: -1 });

WeightLogSchema.pre('save', function (next) {
  this.weightKg = round2(this.weightKg);
  next();
});

// Whenever a new weight is logged, push it onto the Rabbit as the
// denormalized "current weight" IF it's the most recent record we have.
WeightLogSchema.post('save', async function (doc) {
  const rabbit = await Rabbit.findOne({ _id: doc.rabbit, userId: doc.userId });
  if (!rabbit) return;

  if (!rabbit.lastWeighedAt || doc.recordedAt >= rabbit.lastWeighedAt) {
    rabbit.currentWeightKg = doc.weightKg;
    rabbit.lastWeighedAt = doc.recordedAt;
    await rabbit.save();
  }
});

export const WeightLog =
  (models.WeightLog as IWeightLogModel) || model<IWeightLog, IWeightLogModel>('WeightLog', WeightLogSchema);
