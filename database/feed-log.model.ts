import mongoose, { Schema, Model } from 'mongoose';
import { IFeedLog } from './types';

const FeedLogSchema = new Schema<IFeedLog>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    feed_type_id: { type: Schema.Types.ObjectId, ref: 'FeedType', required: true },
    log_date: { type: Date, required: true },
    quantity_kg: { type: Number, required: true, min: 0 },
    cost_usd: { type: Number, required: true, min: 0 }, // Stored in USD base currency
    cage_id: { type: Schema.Types.ObjectId, ref: 'Cage', required: true, index: true },
}, { timestamps: true });

// Compound index for time-series queries (daily/weekly/monthly aggregation)
FeedLogSchema.index({ user_id: 1, log_date: -1, cage_id: 1 });

export const FeedLog = (mongoose.models.FeedLog || mongoose.model<IFeedLog>('FeedLog', FeedLogSchema)) as Model<IFeedLog>;