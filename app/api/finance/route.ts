// app/api/finance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Sale, Expense } from '@/database';
import { initModels } from '@/database/index';
import connectDB from '@/lib/mongodb';

interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByType: Array<{ type: string; amount: number; count: number }>;
  expensesByCategory: Array<{ category: string; amount: number; count: number }>;
  recentSales: Array<{
    id: string;
    transaction_date: string;
    amount_usd: number;
    item_type: string;
    byproduct_type?: string;
    quantity_sold: number;
  }>;
  recentExpenses: Array<{
    id: string;
    transaction_date: string;
    amount_usd: number;
    category: string;
    description: string;
  }>;
  dailyTrends?: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
}

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case 'ytd': {
      const year = end.getFullYear();
      start.setFullYear(year, 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'all':
      start.setFullYear(2000, 0, 1);
      break;
    default:
      start.setDate(end.getDate() - 30); // Default to 30 days
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    initModels();

    // Get period from query params
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';

    const { start, end } = getDateRange(period);

    // Fetch sales data
    const salesData = await Sale.aggregate([
      {
        $match: {
          user_id: userId,
          transaction_date: { $gte: start, $lte: end },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$amount_usd' },
                totalCount: { $sum: 1 },
              },
            },
          ],
          byType: [
            {
              $group: {
                _id: '$item_type',
                amount: { $sum: '$amount_usd' },
                count: { $sum: 1 },
              },
            },
          ],
          recent: [
            { $sort: { transaction_date: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                transaction_date: 1,
                amount_usd: 1,
                item_type: 1,
                byproduct_type: 1,
                quantity_sold: 1,
              },
            },
          ],
          dailyTrends: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$transaction_date' },
                },
                revenue: { $sum: '$amount_usd' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Fetch expenses data
    const expensesData = await Expense.aggregate([
      {
        $match: {
          user_id: userId,
          transaction_date: { $gte: start, $lte: end },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalExpenses: { $sum: '$amount_usd' },
                totalCount: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                amount: { $sum: '$amount_usd' },
                count: { $sum: 1 },
              },
            },
          ],
          recent: [
            { $sort: { transaction_date: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 1,
                transaction_date: 1,
                amount_usd: 1,
                category: 1,
                description: 1,
              },
            },
          ],
          dailyTrends: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$transaction_date' },
                },
                expenses: { $sum: '$amount_usd' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    // Extract and process data
    const salesSummary = salesData[0]?.summary[0] || { totalRevenue: 0, totalCount: 0 };
    const expensesSummary = expensesData[0]?.summary[0] || { totalExpenses: 0, totalCount: 0 };

    const totalRevenue = salesSummary.totalRevenue || 0;
    const totalExpenses = expensesSummary.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Process revenue by type
    const revenueByType = (salesData[0]?.byType || []).map((item: { _id: string; amount: number; count: number }) => ({
      type: item._id,
      amount: item.amount,
      count: item.count,
    }));

    // Process expenses by category
    const expensesByCategory = (expensesData[0]?.byCategory || []).map((item: { _id: string; amount: number; count: number }) => ({
      category: item._id,
      amount: item.amount,
      count: item.count,
    }));

    // Process recent transactions
    const recentSales = (salesData[0]?.recent || []).map((sale: { _id: { toString(): string }; transaction_date: Date; amount_usd: number; item_type: string; byproduct_type?: string; quantity_sold: number }) => ({
      id: sale._id?.toString() || '',
      transaction_date: new Date(sale.transaction_date).toISOString().split('T')[0],
      amount_usd: sale.amount_usd,
      item_type: sale.item_type,
      byproduct_type: sale.byproduct_type,
      quantity_sold: sale.quantity_sold,
    }));

    const recentExpenses = (expensesData[0]?.recent || []).map((expense: { _id: { toString(): string }; transaction_date: Date; amount_usd: number; category: string; description: string }) => ({
      id: expense._id?.toString() || '',
      transaction_date: new Date(expense.transaction_date).toISOString().split('T')[0],
      amount_usd: expense.amount_usd,
      category: expense.category,
      description: expense.description,
    }));

    // Process daily trends
    const salesTrends = salesData[0]?.dailyTrends || [];
    const expenseTrends = expensesData[0]?.dailyTrends || [];

    // Merge trends
    const trendMap = new Map<
      string,
      { date: string; revenue: number; expenses: number }
    >();

    salesTrends.forEach((trend: { _id: string; revenue: number }) => {
      trendMap.set(trend._id, {
        date: trend._id,
        revenue: trend.revenue,
        expenses: 0,
      });
    });

    expenseTrends.forEach((trend: { _id: string; expenses: number }) => {
      const existing = trendMap.get(trend._id) || {
        date: trend._id,
        revenue: 0,
        expenses: 0,
      };
      trendMap.set(trend._id, { ...existing, expenses: trend.expenses });
    });

    const dailyTrends = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const response: FinanceSummary = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      revenueByType,
      expensesByCategory,
      recentSales,
      recentExpenses,
      dailyTrends,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Finance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch finance data' },
      { status: 500 }
    );
  }
}
