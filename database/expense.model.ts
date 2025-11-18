import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  user_id: string | null;
  expense_date: Date;
  category: string;
  amount: number;
  description: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseByCategory {
  category: string;
  total: number;
}

interface IExpenseModel extends Model<IExpense> {
  getTotalExpenses(
    userId: string,
    period: { start: Date; end: Date }
  ): Promise<{ total: number; by_category: ExpenseByCategory[] }>;
}

const expenseSchema = new Schema<IExpense, IExpenseModel>(
  {
    user_id: {
      type: String,
      default: null,
    },
    expense_date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Validate amount
expenseSchema.pre('save', function (next) {
  if (this.amount <= 0) {
    return next(new Error('Amount must be greater than 0'));
  }

  this.expense_date = new Date(this.expense_date.setUTCHours(0, 0, 0, 0));
  next();
});

// Static: Calculate total expenses by category for profit calculation
expenseSchema.statics.getTotalExpenses = async function (
  userId: string,
  period: { start: Date; end: Date }
) {
  const filter: Record<string, unknown> = {
    expense_date: { $gte: period.start, $lte: period.end },
  };

  if (userId) {
    filter.user_id = userId;
  }

  const [totalResult, categoryResult] = await Promise.all([
    this.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    this.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: '$_id', total: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]),
  ]);

  return {
    total: totalResult[0]?.total || 0,
    by_category: categoryResult,
  };
};

// Indexes
expenseSchema.index({ user_id: 1, expense_date: -1 });
expenseSchema.index({ category: 1 });

const Expense = (mongoose.models.Expense as IExpenseModel) || mongoose.model<IExpense, IExpenseModel>('Expense', expenseSchema);

export default Expense;
