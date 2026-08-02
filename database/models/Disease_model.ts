import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { DiseaseSeverity } from '../../types/enums';

export interface IDisease extends Document, ITenantFields {
  _id: Types.ObjectId;
  name: string;
  symptoms: string[];
  defaultSeverity: DiseaseSeverity;
  isContagious: boolean;
  recommendedTreatment?: string;
  preventionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IDiseaseModel extends Model<IDisease> {}

const DiseaseSchema = new Schema<IDisease, IDiseaseModel>(
  {
    name: { type: String, required: true, trim: true },
    symptoms: { type: [String], default: [] },
    defaultSeverity: {
      type: String,
      enum: Object.values(DiseaseSeverity),
      default: DiseaseSeverity.MODERATE,
    },
    isContagious: { type: Boolean, default: false },
    recommendedTreatment: { type: String, trim: true },
    preventionNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

DiseaseSchema.plugin(tenantPlugin);

DiseaseSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Disease =
  (models.Disease as IDiseaseModel) || model<IDisease, IDiseaseModel>('Disease', DiseaseSchema);
