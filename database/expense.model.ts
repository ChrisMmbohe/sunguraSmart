import mongoose, { Schema, Model } from 'mongoose';
import { IExpense } from './types';

const ExpenseSchema = new Schema<IExpense>({
   user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    transaction_date: { type: Date, required: true, index: true }, // Index for P&L queries
    amount_usd: { type: Number, required: true, min: 0 }, // Base currency
    category: { 
        type: String, 
        enum: ['Feed', 'Medical', 'Cages/Equipment', 'Labor', 'Utility', 'Other', 'RabbitPurchase'], 
        required: true, 
        index: true 
    },
    description: { type: String, required: true },
    notes: { type: String, default: null },
}, { timestamps: true });

ExpenseSchema.index({ user_id: 1, transaction_date: -1 });

export const Expense = (mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)) as Model<IExpense>;