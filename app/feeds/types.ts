import { z } from "zod"
import { FeedCategory, FeedUnit } from "@/types/enums"

export type FeedLogDirection = "restock" | "consumption"

export interface SelectOption {
  value: string
  label: string
}

// ---------------------------------------------------------------------------
// FeedType — inventory row
// ---------------------------------------------------------------------------

export interface FeedTypeRowData {
  id: string
  name: string
  category: FeedCategory
  unit: FeedUnit
  stockOnHand: number
  reorderThreshold: number
  costPerUnit?: number
  consumptionRatePerRabbit: number
  consumptionPeriodDays: number
  /** stockOnHand <= reorderThreshold, mirrors FeedType.lowStock's $expr. */
  isLowStock: boolean
  /** stockOnHand * costPerUnit, 0 if no cost is set. */
  stockValue: number
  /** Projected from consumptionRatePerRabbit/consumptionPeriodDays against
   *  the farm's active rabbit count. Null when the rate is 0 (can't burn down). */
  daysOfStockRemaining: number | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// FeedLog — ledger row
// ---------------------------------------------------------------------------

export interface FeedLogRowData {
  id: string
  date: string // ISO
  feedTypeId: string
  feedTypeLabel: string
  category: FeedCategory
  unit: FeedUnit
  direction: FeedLogDirection
  quantity: number
  rabbitsFed?: number
  cageId?: string
  cageLabel?: string
  /** quantity * feedType.costPerUnit, restocks only, undefined if no cost is set. */
  costImpact?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FeedFormOptions {
  feedTypes: SelectOption[]
  cages: SelectOption[]
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface MonthlyQuantityPoint {
  month: string // e.g. "Feb"
  value: number
}

export interface CategoryQuantity {
  category: FeedCategory
  unit: FeedUnit
  total: number
}

export interface LowStockItem {
  id: string
  name: string
  category: FeedCategory
  unit: FeedUnit
  stockOnHand: number
  reorderThreshold: number
}

export interface FeedAnalyticsSummary {
  totalFeedTypes: number
  lowStockCount: number
  totalStockValue: number
  logsThisMonth: number
  feedEfficiency: {
    pelletsGramsPerRabbitPerDay: number
    activeRabbitCount: number
    totalPelletsConsumedKg: number
  }
  pelletsConsumptionTrend: MonthlyQuantityPoint[] // trailing 6 months, kg
  feedSpendTrend: MonthlyQuantityPoint[] // trailing 6 months, currency
  consumptionByCategory: CategoryQuantity[] // trailing 90 days, grouped by (category, unit)
  lowStockItems: LowStockItem[]
}

// ---------------------------------------------------------------------------
// FeedType form
// ---------------------------------------------------------------------------

export const feedTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.nativeEnum(FeedCategory),
  unit: z.nativeEnum(FeedUnit),
  stockOnHand: z.coerce.number().min(0, "Stock can't be negative"),
  reorderThreshold: z.coerce.number().min(0, "Threshold can't be negative"),
  costPerUnit: z.coerce.number().min(0, "Cost can't be negative"),
  consumptionRatePerRabbit: z.coerce.number().min(0, "Rate can't be negative"),
  consumptionPeriodDays: z.coerce.number().min(1, "Must be at least 1 day"),
})

export type FeedTypeFormValues = z.infer<typeof feedTypeFormSchema>

// ---------------------------------------------------------------------------
// FeedLog form
// ---------------------------------------------------------------------------

export const feedLogFormSchema = z.object({
  feedType: z.string().min(1, "Select a feed type"),
  direction: z.enum(["restock", "consumption"]),
  quantity: z.coerce.number().min(0.01, "Enter a quantity greater than 0"),
  rabbitsFed: z.coerce.number().min(0).optional(),
  cage: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  /** Restock-only: also create a linked Expense (category FEED) using
   *  quantity * feedType.costPerUnit as the amount. */
  recordExpense: z.boolean().optional(),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
})

export type FeedLogFormValues = z.infer<typeof feedLogFormSchema>
