import { z } from "zod"
import { SaleItemType, ExpenseCategory, PaymentMethod } from "@/types/enums"
import type { MonthlyFinancePoint } from "@/components/dashboard/dashboard-charts"

export type TransactionKind = "sale" | "expense"

export interface SelectOption {
  value: string
  label: string
}

// ---------------------------------------------------------------------------
// Unified ledger row — Sale and Expense are different shapes, but the
// Finances table shows them side by side as one searchable, filterable
// transaction list, similar to how a bank statement mixes credits/debits.
// ---------------------------------------------------------------------------

export interface FinanceTransactionData {
  id: string
  kind: TransactionKind
  date: string // ISO
  counterparty: string // Sale: buyerName. Expense: vendor, or the category if no vendor given.
  typeLabel: string // Sale: comma-joined item types. Expense: category.
  paymentMethod: PaymentMethod
  amount: number // always positive; kind determines its sign in totals
  relatedRabbitLabel?: string
  relatedFeedTypeLabel?: string
  itemCount?: number // sales only
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FinanceFormOptions {
  rabbits: SelectOption[] // active rabbits, for sale line items / expense.relatedRabbit
  feedTypes: SelectOption[] // for expense.relatedFeedType
}

// ---------------------------------------------------------------------------
// Sale — full detail, fetched lazily when a sale row is opened for editing
// (its `items` array isn't carried in the flattened table row).
// ---------------------------------------------------------------------------

export interface SaleItemFormValue {
  itemType: SaleItemType
  rabbit?: string // "" => none; required in practice when itemType === LIVE_RABBIT
  description?: string
  quantity: number
  unitPrice: number
}

export interface SaleDetailData {
  id: string
  buyerName: string
  buyerContact?: string
  items: SaleItemFormValue[]
  totalAmount: number
  paymentMethod: PaymentMethod
  date: string // ISO
  notes?: string
}

const saleItemSchema = z
  .object({
    itemType: z.nativeEnum(SaleItemType),
    rabbit: z.string().optional().or(z.literal("")),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Unit price can't be negative"),
  })
  .superRefine((item, ctx) => {
    if (item.itemType === SaleItemType.LIVE_RABBIT && !item.rabbit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select which rabbit was sold",
        path: ["rabbit"],
      })
    }
  })

export const saleFormSchema = z.object({
  buyerName: z.string().trim().min(1, "Buyer name is required").max(120),
  buyerContact: z.string().trim().max(120).optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  date: z.string().min(1, "Date is required"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

export type SaleFormValues = z.infer<typeof saleFormSchema>

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export interface ExpenseDetailData {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  paymentMethod: PaymentMethod
  date: string // ISO
  relatedRabbit?: string
  relatedFeedType?: string
  vendor?: string
  notes?: string
}

export const expenseFormSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().trim().min(1, "Description is required").max(200),
  amount: z.coerce.number().min(0.01, "Enter an amount greater than 0"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  date: z.string().min(1, "Date is required"),
  relatedRabbit: z.string().optional().or(z.literal("")),
  relatedFeedType: z.string().optional().or(z.literal("")),
  vendor: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface RevenueByItemType {
  itemType: SaleItemType
  total: number
}

export interface ExpenseByCategory {
  category: ExpenseCategory
  total: number
}

export interface FinanceAnalyticsSummary {
  totalRevenue: number // all-time
  totalExpenses: number // all-time
  netProfit: number // all-time
  profitMarginPct: number // all-time
  transactionCountThisMonth: number
  monthlyTrend: MonthlyFinancePoint[] // trailing 6 months, feeds RevenueExpenseChart
  revenueByItemType: RevenueByItemType[] // trailing 12 months
  expensesByCategory: ExpenseByCategory[] // trailing 12 months
}
