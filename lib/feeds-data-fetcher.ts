import "server-only"

import { auth } from "@clerk/nextjs/server"
import {
  dbConnect,
  FeedType,
  FeedLog,
  Rabbit,
  Cage,
  User,
  RabbitStatus,
  FeedCategory,
} from "@/database"
import type {
  FeedTypeRowData,
  FeedLogRowData,
  FeedFormOptions,
  FeedAnalyticsSummary,
  MonthlyQuantityPoint,
  CategoryQuantity,
  LowStockItem,
} from "@/app/feeds/types"

function requireUserId(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new Error("Not authenticated.")
  }
}

/** The signed-in farm's currency (User.currency, default KES). Feeds <CurrencyProvider>. */
export async function getFeedCurrency(): Promise<string> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const user = await User.findOne({ clerkId: userId }).select("currency").lean<{ currency?: string }>()
  return user?.currency ?? "KES"
}

/**
 * Every FeedType for the tenant, enriched with derived inventory signals:
 * low-stock flag (mirrors FeedType.lowStock's $expr), monetary stock
 * value, and a projected days-of-stock-remaining figure computed from the
 * farm's active rabbit count against the feed type's own reference
 * consumption rate (consumptionRatePerRabbit / consumptionPeriodDays).
 */
export async function getFeedTypes(): Promise<FeedTypeRowData[]> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const [feedTypes, activeRabbitCount] = await Promise.all([
    FeedType.find({ userId }).sort({ name: 1 }).lean<any[]>(),
    Rabbit.countDocuments({ userId, status: RabbitStatus.ACTIVE }),
  ])

  return feedTypes.map((f) => {
    const stockValue = f.costPerUnit
      ? Math.round((f.stockOnHand * f.costPerUnit + Number.EPSILON) * 100) / 100
      : 0
    const dailyBurn =
      f.consumptionPeriodDays > 0 ? (f.consumptionRatePerRabbit * activeRabbitCount) / f.consumptionPeriodDays : 0
    const daysOfStockRemaining = dailyBurn > 0 ? Math.round(f.stockOnHand / dailyBurn) : null

    return {
      id: String(f._id),
      name: f.name,
      category: f.category,
      unit: f.unit,
      stockOnHand: f.stockOnHand,
      reorderThreshold: f.reorderThreshold,
      costPerUnit: f.costPerUnit,
      consumptionRatePerRabbit: f.consumptionRatePerRabbit,
      consumptionPeriodDays: f.consumptionPeriodDays,
      isLowStock: f.stockOnHand <= f.reorderThreshold,
      stockValue,
      daysOfStockRemaining,
      createdAt: new Date(f.createdAt).toISOString(),
      updatedAt: new Date(f.updatedAt).toISOString(),
    }
  })
}

/** Every FeedLog for the tenant, flattened with feed-type and cage labels for the table. */
export async function getFeedLogs(): Promise<FeedLogRowData[]> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const logs = await FeedLog.find({ userId })
    .populate({ path: "feedType", select: "name category unit costPerUnit" })
    .populate({ path: "cage", select: "label" })
    .sort({ date: -1 })
    .lean<any[]>()

  return logs
    .filter((l) => l.feedType) // guard against a feed type deleted out from under a log
    .map((l) => {
      const feedType = l.feedType
      const costImpact =
        l.direction === "restock" && feedType.costPerUnit
          ? Math.round((l.quantity * feedType.costPerUnit + Number.EPSILON) * 100) / 100
          : undefined

      return {
        id: String(l._id),
        date: new Date(l.date).toISOString(),
        feedTypeId: String(feedType._id),
        feedTypeLabel: feedType.name,
        category: feedType.category,
        unit: feedType.unit,
        direction: l.direction,
        quantity: l.quantity,
        rabbitsFed: l.rabbitsFed,
        cageId: l.cage ? String(l.cage._id) : undefined,
        cageLabel: l.cage?.label,
        costImpact,
        notes: l.notes,
        createdAt: new Date(l.createdAt).toISOString(),
        updatedAt: new Date(l.updatedAt).toISOString(),
      }
    })
}

/** Feed types + cages, for the log-entry form's selects. */
export async function getFeedFormOptions(): Promise<FeedFormOptions> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const [feedTypes, cages] = await Promise.all([
    FeedType.find({ userId }).select("name unit stockOnHand").sort({ name: 1 }).lean<any[]>(),
    Cage.find({ userId }).select("label location").sort({ label: 1 }).lean<any[]>(),
  ])

  return {
    feedTypes: feedTypes.map((f) => ({
      value: String(f._id),
      label: `${f.name} (${f.stockOnHand} ${f.unit} on hand)`,
    })),
    cages: cages.map((c) => ({
      value: String(c._id),
      label: c.location ? `${c.label} — ${c.location}` : c.label,
    })),
  }
}

/**
 * Farm-wide feed analytics: inventory snapshot (types, low-stock count,
 * total stock value), this-month activity, the trailing-30-day feed
 * efficiency figure (FeedLog.getFeedEfficiency), a 6-month pellet
 * consumption trend and feed-spend trend, and a 90-day consumption
 * breakdown by category. The two trend aggregations and the category
 * breakdown aren't covered by an existing model static, so they're
 * computed here directly against FeedLog, joined to FeedType for
 * category/unit/cost — the same $lookup-based approach the models use
 * internally (e.g. FeedLog.getFeedEfficiency).
 */
export async function getFeedAnalytics(): Promise<FeedAnalyticsSummary> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000)

  const [feedTypes, lowStockDocs, logsThisMonth, feedEfficiency, pelletsTrendRaw, spendTrendRaw, categoryRaw] =
    await Promise.all([
      FeedType.find({ userId }).select("costPerUnit stockOnHand").lean<any[]>(),
      FeedType.lowStock(userId).select("name category unit stockOnHand reorderThreshold").lean<any[]>(),
      FeedLog.countDocuments({ userId, date: { $gte: startOfMonth } }),
      FeedLog.getFeedEfficiency(userId, 30),
      FeedLog.aggregate([
        { $match: { userId, direction: "consumption", date: { $gte: sixMonthsAgo } } },
        { $lookup: { from: "feedtypes", localField: "feedType", foreignField: "_id", as: "ft" } },
        { $unwind: "$ft" },
        { $match: { "ft.category": FeedCategory.PELLETS } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            totalKg: {
              $sum: {
                $cond: [{ $eq: ["$ft.unit", "g"] }, { $divide: ["$quantity", 1000] }, "$quantity"],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      FeedLog.aggregate([
        { $match: { userId, direction: "restock", date: { $gte: sixMonthsAgo } } },
        { $lookup: { from: "feedtypes", localField: "feedType", foreignField: "_id", as: "ft" } },
        { $unwind: "$ft" },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            totalSpend: { $sum: { $multiply: ["$quantity", { $ifNull: ["$ft.costPerUnit", 0] }] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      FeedLog.aggregate([
        { $match: { userId, direction: "consumption", date: { $gte: ninetyDaysAgo } } },
        { $lookup: { from: "feedtypes", localField: "feedType", foreignField: "_id", as: "ft" } },
        { $unwind: "$ft" },
        {
          $group: {
            _id: { category: "$ft.category", unit: "$ft.unit" },
            total: { $sum: "$quantity" },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ])

  const totalStockValue = feedTypes.reduce(
    (sum, f) => sum + (f.costPerUnit ? f.stockOnHand * f.costPerUnit : 0),
    0
  )

  const monthKey = (year: number, month: number) => `${year}-${month}`
  const pelletsMap = new Map(pelletsTrendRaw.map((r: any) => [monthKey(r._id.year, r._id.month), r.totalKg]))
  const spendMap = new Map(spendTrendRaw.map((r: any) => [monthKey(r._id.year, r._id.month), r.totalSpend]))

  const pelletsConsumptionTrend: MonthlyQuantityPoint[] = []
  const feedSpendTrend: MonthlyQuantityPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKey(d.getFullYear(), d.getMonth() + 1)
    const label = d.toLocaleDateString(undefined, { month: "short" })
    pelletsConsumptionTrend.push({ month: label, value: Math.round((pelletsMap.get(key) ?? 0) * 100) / 100 })
    feedSpendTrend.push({ month: label, value: Math.round((spendMap.get(key) ?? 0) * 100) / 100 })
  }

  const consumptionByCategory: CategoryQuantity[] = categoryRaw.map((r: any) => ({
    category: r._id.category,
    unit: r._id.unit,
    total: Math.round(r.total * 100) / 100,
  }))

  const lowStockItems: LowStockItem[] = lowStockDocs.map((f) => ({
    id: String(f._id),
    name: f.name,
    category: f.category,
    unit: f.unit,
    stockOnHand: f.stockOnHand,
    reorderThreshold: f.reorderThreshold,
  }))

  return {
    totalFeedTypes: feedTypes.length,
    lowStockCount: lowStockDocs.length,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    logsThisMonth,
    feedEfficiency,
    pelletsConsumptionTrend,
    feedSpendTrend,
    consumptionByCategory,
    lowStockItems,
  }
}
