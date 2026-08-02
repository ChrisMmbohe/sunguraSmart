import { Schema, model, models, Model, Document, Types } from 'mongoose';
import { tenantPlugin, ITenantFields } from '../plugins/_tenantPlugin';
import { ExpenseCategory, PaymentMethod } from '../../types/enums';
import { round2 } from '../utils/ownership.util';
import { Sale } from './Sale_model';

export interface IExpense extends Document, ITenantFields {
  _id: Types.ObjectId;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  relatedRabbit?: Types.ObjectId | null;
  relatedFeedType?: Types.ObjectId | null;
  vendor?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INetProfitReport {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPct: number; // 0-100
}

export interface IExpenseModel extends Model<IExpense> {
  totalExpenses(userId: string, from?: Date, to?: Date): Promise<number>;
  expensesByCategory(userId: string, from?: Date, to?: Date): Promise<{ category: ExpenseCategory; total: number }[]>;
  netProfitInputs(userId: string, from?: Date, to?: Date): Promise<{ totalExpenses: number }>;
  getNetProfitReport(userId: string, from?: Date, to?: Date): Promise<INetProfitReport>;
  monthlyExpenseTrend(userId: string, months?: number): Promise<{ year: number; month: number; total: number }[]>;
}

const ExpenseSchema = new Schema<IExpense, IExpenseModel>(
  {
    category: { type: String, enum: Object.values(ExpenseCategory), required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.CASH },
    date: { type: Date, required: true, default: Date.now },
    relatedRabbit: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null },
    relatedFeedType: { type: Schema.Types.ObjectId, ref: 'FeedType', default: null },
    vendor: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ExpenseSchema.plugin(tenantPlugin);

ExpenseSchema.index({ userId: 1, date: -1 });

ExpenseSchema.pre('save', function (next) {
  this.amount = round2(this.amount);
  next();
});

ExpenseSchema.statics.totalExpenses = async function (userId: string, from?: Date, to?: Date) {
  const match: Record<string, unknown> = { userId };
  if (from || to) {
    match.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }
  const result = await this.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return result[0]?.total ?? 0;
};

ExpenseSchema.statics.expensesByCategory = async function (userId: string, from?: Date, to?: Date) {
  const match: Record<string, unknown> = { userId };
  if (from || to) {
    match.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }
  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  return result.map((r) => ({ category: r._id, total: r.total }));
};

ExpenseSchema.statics.netProfitInputs = async function (userId: string, from?: Date, to?: Date) {
  const total = await (this as IExpenseModel).totalExpenses(userId, from, to);
  return { totalExpenses: total };
};

ExpenseSchema.statics.getNetProfitReport = async function (userId: string, from?: Date, to?: Date) {
  const [totalRevenue, totalExpenses] = await Promise.all([
    Sale.totalRevenue(userId, from, to),
    (this as IExpenseModel).totalExpenses(userId, from, to),
  ]);

  const netProfit = round2(totalRevenue - totalExpenses);
  const profitMarginPct = totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : 0;

  return { totalRevenue, totalExpenses, netProfit, profitMarginPct };
};

ExpenseSchema.statics.monthlyExpenseTrend = async function (userId: string, months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const result = await this.aggregate([
    { $match: { userId, date: { $gte: since } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return result.map((r) => ({ year: r._id.year, month: r._id.month, total: r.total }));
};

export const Expense =
  (models.Expense as IExpenseModel) || model<IExpense, IExpenseModel>('Expense', ExpenseSchema);
