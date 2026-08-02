import "server-only"

import { auth } from "@clerk/nextjs/server"
import {
  dbConnect,
  Sale,
  Expense,
  Rabbit,
  FeedType,
  RabbitStatus,
  User,
} from "@/database"
import type { MonthlyFinancePoint } from "@/components/dashboard/dashboard-charts"
import type {
  FinanceTransactionData,
  FinanceFormOptions,
  FinanceAnalyticsSummary,
  SaleDetailData,
  ExpenseDetailData,
} from "@/app/finances/types"

function requireUserId(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new Error("Not authenticated.")
  }
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** The signed-in farm's currency (User.currency, default KES). Feeds <CurrencyProvider>. */
export async function getFinanceCurrency(): Promise<string> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const user = await User.findOne({ clerkId: userId }).select("currency").lean<{ currency?: string }>()
  return user?.currency ?? "KES"
}

/**
 * Fetches every Sale and Expense for the current tenant, populated with
 * rabbit/feed-type display labels, merged into one date-sorted ledger.
 * Sale line items aren't carried here (see getSaleDetail) — the table
 * only needs a summary label for each row.
 */
export async function getFinanceTransactions(): Promise<FinanceTransactionData[]> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const [sales, expenses] = await Promise.all([
    Sale.find({ userId })
      .populate({ path: "items.rabbit", select: "name tagNumber" })
      .sort({ date: -1 })
      .lean<any[]>(),
    Expense.find({ userId })
      .populate({ path: "relatedRabbit", select: "name tagNumber" })
      .populate({ path: "relatedFeedType", select: "name" })
      .sort({ date: -1 })
      .lean<any[]>(),
  ])

  const saleRows: FinanceTransactionData[] = sales.map((s) => {
    const distinctTypes = Array.from(new Set(s.items.map((i: any) => i.itemType)))
    const firstRabbit = s.items.find((i: any) => i.rabbit)?.rabbit

    return {
      id: String(s._id),
      kind: "sale",
      date: new Date(s.date).toISOString(),
      counterparty: s.buyerName,
      typeLabel: distinctTypes.map(toTitleCase).join(", "),
      paymentMethod: s.paymentMethod,
      amount: s.totalAmount,
      relatedRabbitLabel: firstRabbit ? firstRabbit.name || firstRabbit.tagNumber : undefined,
      itemCount: s.items.length,
      notes: s.notes,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString(),
    }
  })

  const expenseRows: FinanceTransactionData[] = expenses.map((e) => ({
    id: String(e._id),
    kind: "expense",
    date: new Date(e.date).toISOString(),
    counterparty: e.vendor || toTitleCase(e.category),
    typeLabel: toTitleCase(e.category),
    paymentMethod: e.paymentMethod,
    amount: e.amount,
    relatedRabbitLabel: e.relatedRabbit ? e.relatedRabbit.name || e.relatedRabbit.tagNumber : undefined,
    relatedFeedTypeLabel: e.relatedFeedType?.name,
    notes: e.notes,
    createdAt: new Date(e.createdAt).toISOString(),
    updatedAt: new Date(e.updatedAt).toISOString(),
  }))

  return [...saleRows, ...expenseRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Active rabbits + feed types, for the sale/expense form selects. */
export async function getFinanceFormOptions(): Promise<FinanceFormOptions> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const [rabbits, feedTypes] = await Promise.all([
    Rabbit.find({ userId, status: RabbitStatus.ACTIVE }).select("name tagNumber").sort({ tagNumber: 1 }).lean<any[]>(),
    FeedType.find({ userId }).select("name").sort({ name: 1 }).lean<any[]>(),
  ])

  return {
    rabbits: rabbits.map((r) => ({
      value: String(r._id),
      label: r.name ? `${r.name} (#${r.tagNumber})` : `#${r.tagNumber}`,
    })),
    feedTypes: feedTypes.map((f) => ({ value: String(f._id), label: f.name })),
  }
}

/** Full detail for one sale, fetched lazily when its row is opened for editing. */
export async function getSaleDetail(id: string): Promise<SaleDetailData | null> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const sale = await Sale.findOne({ _id: id, userId }).lean<any>()
  if (!sale) return null

  return {
    id: String(sale._id),
    buyerName: sale.buyerName,
    buyerContact: sale.buyerContact,
    items: sale.items.map((i: any) => ({
      itemType: i.itemType,
      rabbit: i.rabbit ? String(i.rabbit) : "",
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    totalAmount: sale.totalAmount,
    paymentMethod: sale.paymentMethod,
    date: new Date(sale.date).toISOString(),
    notes: sale.notes,
  }
}

/** Full detail for one expense, fetched lazily when its row is opened for editing. */
export async function getExpenseDetail(id: string): Promise<ExpenseDetailData | null> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const expense = await Expense.findOne({ _id: id, userId }).lean<any>()
  if (!expense) return null

  return {
    id: String(expense._id),
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    date: new Date(expense.date).toISOString(),
    relatedRabbit: expense.relatedRabbit ? String(expense.relatedRabbit) : undefined,
    relatedFeedType: expense.relatedFeedType ? String(expense.relatedFeedType) : undefined,
    vendor: expense.vendor,
    notes: expense.notes,
  }
}

/**
 * Farm-wide finance analytics: all-time net profit (via Expense's own
 * static, same one the Dashboard uses), a trailing-6-month trend merged
 * from Sale/Expense's monthly-trend statics to feed the existing
 * RevenueExpenseChart, and trailing-12-month breakdowns by item type and
 * expense category.
 */
export async function getFinanceAnalytics(): Promise<FinanceAnalyticsSummary> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [netProfitReport, revenueTrend, expenseTrend, revenueByItemType, expensesByCategory, saleCountThisMonth, expenseCountThisMonth] =
    await Promise.all([
      Expense.getNetProfitReport(userId),
      Sale.monthlyRevenueTrend(userId, 6),
      Expense.monthlyExpenseTrend(userId, 6),
      Sale.revenueByItemType(userId, twelveMonthsAgo),
      Expense.expensesByCategory(userId, twelveMonthsAgo),
      Sale.countDocuments({ userId, date: { $gte: startOfMonth } }),
      Expense.countDocuments({ userId, date: { $gte: startOfMonth } }),
    ])

  const monthKey = (year: number, month: number) => `${year}-${month}`
  const revenueMap = new Map(revenueTrend.map((r) => [monthKey(r.year, r.month), r.total]))
  const expenseMap = new Map(expenseTrend.map((e) => [monthKey(e.year, e.month), e.total]))

  const monthlyTrend: MonthlyFinancePoint[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d.getFullYear(), d.getMonth() + 1)
    monthlyTrend.push({
      month: d.toLocaleDateString(undefined, { month: "short" }),
      revenue: revenueMap.get(key) ?? 0,
      expenses: expenseMap.get(key) ?? 0,
    })
  }

  return {
    totalRevenue: netProfitReport.totalRevenue,
    totalExpenses: netProfitReport.totalExpenses,
    netProfit: netProfitReport.netProfit,
    profitMarginPct: netProfitReport.profitMarginPct,
    transactionCountThisMonth: saleCountThisMonth + expenseCountThisMonth,
    monthlyTrend,
    revenueByItemType,
    expensesByCategory,
  }
}
