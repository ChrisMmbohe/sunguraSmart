import mongoose, { Schema } from 'mongoose';
// ✅ FIX: Change import to ISaleModel
import { ISale, ISaleModel } from './types';

const SaleSchema = new Schema<ISale>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    transaction_date: { type: Date, required: true, index: true }, // Index for P&L queries (7d, 30d, 90d)
    amount_usd: { type: Number, required: true, min: 0 }, // Base currency
    item_type: { 
        type: String, 
        enum: ['Rabbit', 'ByProduct', 'Other'], 
        required: true, 
        index: true 
    },
    rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null, index: true },
    // Explicitly allowing sale of by-products (manure, urine, pelts)
    byproduct_type: { 
        type: String, 
        enum: ['Manure', 'Urine', 'Pelts', 'Other', null], 
        default: null 
    },
    quantity_sold: { type: Number, required: true, min: 0 },
    notes: { type: String, default: null },
}, { timestamps: true });

// --- STATIC METHOD IMPLEMENTATION ---
SaleSchema.statics.getTotalIncome = async function(
    userId: string,
    dateRange: { start: Date; end: Date }
): Promise<number> {
    
    // Mongoose aggregation pipeline to sum 'amount_usd' for sales within the date range
    // and matching the user ID.
    const result = await this.aggregate([
        {
            $match: {
                user_id: userId,
                transaction_date: {
                    $gte: dateRange.start,
                    $lte: dateRange.end,
                },
            },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount_usd' },
            },
        },
    ]);

    // Return the totalRevenue, or 0 if no sales were found
    return result.length > 0 ? result[0].totalRevenue : 0;
};


SaleSchema.index({ user_id: 1, transaction_date: -1 });

// ✅ FIX: Export Sale with the correct ISaleModel type
export const Sale = (mongoose.models.Sale || mongoose.model<ISale, ISaleModel>('Sale', SaleSchema)) as ISaleModel;