import { Schema, model, models, Model, Document, Types } from 'mongoose';

/**
 * NOTE: This model deliberately does NOT use the tenant plugin.
 * Demo requests come from prospects on the public marketing site who may
 * not have signed up (or even decided to) yet, so there's no Clerk userId
 * to scope it to. Treat this as a lead/CRM record, not farm data.
 */
export enum DemoRequestStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  DECLINED = 'declined',
}

export enum FarmSizeRange {
  UNDER_50 = 'under_50',
  BETWEEN_50_200 = '50_200',
  BETWEEN_200_500 = '200_500',
  OVER_500 = 'over_500',
}

export interface IDemoRequest extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  farmName?: string;
  farmSize?: FarmSizeRange;
  message?: string;
  status: DemoRequestStatus;
  source: string; // e.g. "homepage", "pricing-page"
  createdAt: Date;
  updatedAt: Date;
}

interface IDemoRequestModel extends Model<IDemoRequest> {}

const DemoRequestSchema = new Schema<IDemoRequest, IDemoRequestModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    farmName: { type: String, trim: true },
    farmSize: { type: String, enum: Object.values(FarmSizeRange) },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(DemoRequestStatus),
      default: DemoRequestStatus.NEW,
      index: true,
    },
    source: { type: String, default: 'homepage', trim: true },
  },
  { timestamps: true }
);

DemoRequestSchema.index({ email: 1, createdAt: -1 });

export const DemoRequest =
  (models.DemoRequest as IDemoRequestModel) ||
  model<IDemoRequest, IDemoRequestModel>('DemoRequest', DemoRequestSchema);
