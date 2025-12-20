import mongoose, { Schema, Model } from 'mongoose';
import { IDisease } from './types';

const DiseaseSchema = new Schema<IDisease>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    name: { type: String, required: true, trim: true, unique: true },
    symptoms: [{ type: String, trim: true }],
    treatment_protocols: { type: String },
    is_quarantinable: { type: Boolean, default: false },
}, { timestamps: true });

export const Disease = (mongoose.models.Disease || mongoose.model<IDisease>('Disease', DiseaseSchema)) as Model<IDisease>;