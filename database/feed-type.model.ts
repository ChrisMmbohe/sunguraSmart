import mongoose, { Schema, Model } from 'mongoose';
import { IFeedType } from './types';

const FeedTypeSchema = new Schema<IFeedType>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    name: { type: String, required: true, trim: true, unique: true },
    cost_per_kg: { type: Number, min: 0, required: true },
}, { timestamps: true });

export const FeedType = (mongoose.models.FeedType || mongoose.model<IFeedType>('FeedType', FeedTypeSchema)) as Model<IFeedType>;