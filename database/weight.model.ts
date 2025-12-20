import mongoose, { Schema, Model } from 'mongoose';
import { IWeight } from './types';

const WeightSchema = new Schema<IWeight>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, index: true },
    measurement_date: { type: Date, required: true },
    weight_kg: { type: Number, required: true, min: 0 },
    age_at_measurement_days: { type: Number, required: true, min: 0 }, // Indexed for growth curve queries
}, { timestamps: true });

// Compound index: Best for fetching the latest weight and period queries (7d, 30d, 90d)
WeightSchema.index({ rabbit_id: 1, measurement_date: -1 });

export const Weight = (mongoose.models.Weight || mongoose.model<IWeight>('Weight', WeightSchema)) as Model<IWeight>;