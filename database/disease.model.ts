import mongoose, { Schema, Document, Model } from 'mongoose';

type Severity = 'Low' | 'Medium' | 'High';

export interface IDisease extends Document {
  name: string;
  symptoms: string[];
  treatments: string[];
  prevention: string | null;
  severity: Severity;
  createdAt: Date;
  updatedAt: Date;
}

interface IDiseaseModel extends Model<IDisease> {}

const diseaseSchema = new Schema<IDisease, IDiseaseModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    treatments: {
      type: [String],
      default: [],
    },
    prevention: {
      type: String,
      default: null,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
diseaseSchema.index({ name: 1 });

const Disease = (mongoose.models.Disease as IDiseaseModel) || mongoose.model<IDisease, IDiseaseModel>('Disease', diseaseSchema);

export default Disease;
