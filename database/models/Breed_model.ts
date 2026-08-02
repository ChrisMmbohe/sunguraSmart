import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';

export interface IBreed extends Document, ITenantFields {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  averageAdultWeightKg?: number;
  averageLitterSize?: number;
  gestationDays: number; // default 31, kept per-breed for flexibility
  maturityAgeDays: number; // age at which a rabbit is considered breeding-mature
  weaningAgeDays: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IBreedModel extends Model<IBreed> {}

const BreedSchema = new Schema<IBreed, IBreedModel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    averageAdultWeightKg: { type: Number, min: 0 },
    averageLitterSize: { type: Number, min: 0 },
    gestationDays: { type: Number, default: 31, min: 1 },
    maturityAgeDays: { type: Number, default: 150, min: 1 }, // ~5 months
    weaningAgeDays: { type: Number, default: 42, min: 1 }, // ~6 weeks
  },
  { timestamps: true }
);

BreedSchema.plugin(tenantPlugin);

// A farm shouldn't have two breeds with the same name.
BreedSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Breed = (models.Breed as IBreedModel) || model<IBreed, IBreedModel>('Breed', BreedSchema);
