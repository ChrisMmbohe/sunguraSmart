import mongoose, { Schema, Model } from 'mongoose';
import { IBreed } from './types';

const BreedSchema = new Schema<IBreed>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: null },
    average_mature_weight_kg: { type: Number, required: true, min: 0 },
    maturity_age_days: { type: Number, required: true, min: 1, default: 150 }, // ~5 months
    weaning_age_days: { type: Number, required: true, min: 1, default: 30 }, // ~1 month
    grower_age_days: { type: Number, required: true, min: 1, default: 60 }, // ~2 months
}, { timestamps: true });

export const Breed = (mongoose.models.Breed || mongoose.model<IBreed>('Breed', BreedSchema)) as Model<IBreed>;