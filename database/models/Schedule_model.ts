import { Schema, model, models, Model, Document, Types, Query } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { ScheduleType, ScheduleStatus, RecurrenceFrequency } from '../../types/enums';
import { addDays } from '../utils/ownership.util';

export interface IScheduleRecurrence {
  frequency: RecurrenceFrequency;
  customDays?: number; // used when frequency === CUSTOM_DAYS
}

export interface ISchedule extends Document, ITenantFields {
  _id: Types.ObjectId;
  title: string;
  type: ScheduleType;
  rabbit?: Types.ObjectId | null; // null = farm-wide task (e.g. restock hay)
  dueDate: Date;
  status: ScheduleStatus;
  recurrence: IScheduleRecurrence;
  completedDate?: Date;
  relatedHealthRecord?: Types.ObjectId | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleModel extends Model<ISchedule> {
  findUpcoming(userId: string, withinDays?: number): Query<ISchedule[], ISchedule>;
  findOverdue(userId: string): Query<ISchedule[], ISchedule>;
  markCompleted(userId: string, scheduleId: Types.ObjectId): Promise<ISchedule | null>;
}

const ScheduleRecurrenceSchema = new Schema<IScheduleRecurrence>(
  {
    frequency: {
      type: String,
      enum: Object.values(RecurrenceFrequency),
      default: RecurrenceFrequency.NONE,
    },
    customDays: { type: Number, min: 1 },
  },
  { _id: false }
);

const ScheduleSchema = new Schema<ISchedule, IScheduleModel>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(ScheduleType), required: true },
    rabbit: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ScheduleStatus),
      default: ScheduleStatus.PENDING,
      index: true,
    },
    recurrence: { type: ScheduleRecurrenceSchema, default: () => ({ frequency: RecurrenceFrequency.NONE }) },
    completedDate: { type: Date },
    relatedHealthRecord: { type: Schema.Types.ObjectId, ref: 'HealthRecord', default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ScheduleSchema.plugin(tenantPlugin);

ScheduleSchema.index({ userId: 1, dueDate: 1, status: 1 });
ScheduleSchema.index({ userId: 1, rabbit: 1 });

const RECURRENCE_DAYS: Record<RecurrenceFrequency, number | null> = {
  [RecurrenceFrequency.NONE]: null,
  [RecurrenceFrequency.DAILY]: 1,
  [RecurrenceFrequency.WEEKLY]: 7,
  [RecurrenceFrequency.BIWEEKLY]: 14,
  [RecurrenceFrequency.MONTHLY]: 30,
  [RecurrenceFrequency.CUSTOM_DAYS]: null, // resolved from recurrence.customDays
};

ScheduleSchema.statics.findUpcoming = function (userId: string, withinDays = 7) {
  const cutoff = addDays(new Date(), withinDays);
  return this.find({
    userId,
    status: ScheduleStatus.PENDING,
    dueDate: { $gte: new Date(), $lte: cutoff },
  }).sort({ dueDate: 1 });
};

ScheduleSchema.statics.findOverdue = function (userId: string) {
  return this.find({
    userId,
    status: ScheduleStatus.PENDING,
    dueDate: { $lt: new Date() },
  }).sort({ dueDate: 1 });
};

/**
 * Marks a schedule item completed and, if it's recurring, automatically
 * creates the next occurrence — this is the "repeats" alert automation
 * (e.g. quarterly deworming) called for in the project goals.
 */
ScheduleSchema.statics.markCompleted = async function (userId: string, scheduleId: Types.ObjectId) {
  const doc = await this.findOne({ _id: scheduleId, userId });
  if (!doc) return null;

  doc.status = ScheduleStatus.COMPLETED;
  doc.completedDate = new Date();
  await doc.save();

  const days =
    doc.recurrence.frequency === RecurrenceFrequency.CUSTOM_DAYS
      ? doc.recurrence.customDays ?? null
      : RECURRENCE_DAYS[doc.recurrence.frequency];

  if (days) {
    await this.create({
      userId,
      title: doc.title,
      type: doc.type,
      rabbit: doc.rabbit,
      dueDate: addDays(doc.completedDate, days),
      recurrence: doc.recurrence,
      notes: doc.notes,
    });
  }

  return doc;
};

export const Schedule =
  (models.Schedule as IScheduleModel) || model<ISchedule, IScheduleModel>('Schedule', ScheduleSchema);
