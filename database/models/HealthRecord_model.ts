import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { HealthRecordType, HealthRecordOutcome, HealthStatus, RabbitStatus } from '../../types/enums';
import { Rabbit } from './Rabbit_model';

export interface IHealthRecord extends Document, ITenantFields {
  _id: Types.ObjectId;
  rabbit: Types.ObjectId;
  type: HealthRecordType;
  disease?: Types.ObjectId | null; // linked when type is illness/vaccination-for-disease
  date: Date;
  treatment?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  outcome: HealthRecordOutcome;
  followUpDate?: Date; // drives Schedule creation for repeat treatments
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHealthRecordModel extends Model<IHealthRecord> {
  findForRabbit(userId: string, rabbitId: Types.ObjectId): Promise<IHealthRecord[]>;
}

const HealthRecordSchema = new Schema<IHealthRecord, IHealthRecordModel>(
  {
    rabbit: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    type: { type: String, enum: Object.values(HealthRecordType), required: true },
    disease: { type: Schema.Types.ObjectId, ref: 'Disease', default: null },
    date: { type: Date, required: true, default: Date.now },
    treatment: { type: String, trim: true },
    medication: { type: String, trim: true },
    dosage: { type: String, trim: true },
    cost: { type: Number, min: 0 },
    outcome: {
      type: String,
      enum: Object.values(HealthRecordOutcome),
      default: HealthRecordOutcome.ONGOING,
    },
    followUpDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

HealthRecordSchema.plugin(tenantPlugin);

HealthRecordSchema.index({ userId: 1, rabbit: 1, date: -1 });
HealthRecordSchema.index({ userId: 1, followUpDate: 1 });

// Sync the parent Rabbit's healthStatus so population/dashboard counts
// (sick / recovering / healthy) always reflect the latest record.
HealthRecordSchema.post('save', async function (doc) {
  const rabbit = await Rabbit.findOne({ _id: doc.rabbit, userId: doc.userId });
  if (!rabbit) return;

  let nextStatus: HealthStatus | null = null;

  switch (doc.outcome) {
    case HealthRecordOutcome.DECEASED:
      nextStatus = HealthStatus.DECEASED;
      break;
    case HealthRecordOutcome.RECOVERED:
      nextStatus = HealthStatus.HEALTHY;
      break;
    case HealthRecordOutcome.CHRONIC:
      nextStatus = HealthStatus.RECOVERING;
      break;
    case HealthRecordOutcome.ONGOING:
      nextStatus =
        doc.type === HealthRecordType.ILLNESS || doc.type === HealthRecordType.INJURY
          ? HealthStatus.SICK
          : rabbit.healthStatus;
      break;
  }

  if (nextStatus && nextStatus !== rabbit.healthStatus) {
    rabbit.healthStatus = nextStatus;
    if (nextStatus === HealthStatus.DECEASED) {
      rabbit.status = RabbitStatus.DECEASED;
      rabbit.deceasedDate = rabbit.deceasedDate ?? doc.date;
    }
    await rabbit.save();
  }
});

HealthRecordSchema.statics.findForRabbit = function (userId: string, rabbitId: Types.ObjectId) {
  return this.find({ userId, rabbit: rabbitId }).sort({ date: -1 });
};

export const HealthRecord =
  (models.HealthRecord as IHealthRecordModel) ||
  model<IHealthRecord, IHealthRecordModel>('HealthRecord', HealthRecordSchema);
