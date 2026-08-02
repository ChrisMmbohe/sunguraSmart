"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { dbConnect, Sale, Expense } from "@/database"
import { saleFormSchema, expenseFormSchema, type SaleFormValues, type ExpenseFormValues } from "./types"
import { getSaleDetail, getExpenseDetail } from "@/lib/finances-data-fetcher"

export interface ActionResult {
  success: boolean
  error?: string
}

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  return userId
}

function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { message?: string }
    if (anyErr.message) return anyErr.message
  }
  return "Something went wrong. Please try again."
}

// ---------------------------------------------------------------------------
// Lazy detail fetchers — used when a table/calendar row is opened for
// editing, since the flattened FinanceTransactionData row doesn't carry a
// sale's full items array.
// ---------------------------------------------------------------------------

export async function getSaleForEdit(id: string) {
  return getSaleDetail(id)
}

export async function getExpenseForEdit(id: string) {
  return getExpenseDetail(id)
}

// ---------------------------------------------------------------------------
// Sale
// ---------------------------------------------------------------------------

function toSaleDoc(values: SaleFormValues) {
  return {
    buyerName: values.buyerName,
    buyerContact: values.buyerContact || undefined,
    items: values.items.map((item) => ({
      itemType: item.itemType,
      rabbit: item.rabbit || null,
      description: item.description || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    paymentMethod: values.paymentMethod,
    date: new Date(values.date),
    notes: values.notes || undefined,
  }
}

export async function createSale(values: SaleFormValues): Promise<ActionResult> {
  const parsed = saleFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    // totalAmount is required by the schema type but is always overwritten
    // by Sale's own pre('validate') hook before it's persisted.
    const sale = new Sale({ ...toSaleDoc(parsed.data), totalAmount: 0, userId })
    await sale.save()

    revalidatePath("/finances")
    revalidatePath("/dashboard")
    revalidatePath("/rabbits")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateSale(id: string, values: SaleFormValues): Promise<ActionResult> {
  const parsed = saleFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const sale = await Sale.findOne({ _id: id, userId })
    if (!sale) {
      return { success: false, error: "Sale not found on your farm." }
    }

    Object.assign(sale, toSaleDoc(parsed.data))
    await sale.save()

    revalidatePath("/finances")
    revalidatePath("/dashboard")
    revalidatePath("/rabbits")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteSale(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const result = await Sale.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) {
      return { success: false, error: "Sale not found on your farm." }
    }

    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

function toExpenseDoc(values: ExpenseFormValues) {
  return {
    category: values.category,
    description: values.description,
    amount: values.amount,
    paymentMethod: values.paymentMethod,
    date: new Date(values.date),
    relatedRabbit: values.relatedRabbit || null,
    relatedFeedType: values.relatedFeedType || null,
    vendor: values.vendor || undefined,
    notes: values.notes || undefined,
  }
}

export async function createExpense(values: ExpenseFormValues): Promise<ActionResult> {
  const parsed = expenseFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const expense = new Expense({ ...toExpenseDoc(parsed.data), userId })
    await expense.save()

    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateExpense(id: string, values: ExpenseFormValues): Promise<ActionResult> {
  const parsed = expenseFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const expense = await Expense.findOne({ _id: id, userId })
    if (!expense) {
      return { success: false, error: "Expense not found on your farm." }
    }

    Object.assign(expense, toExpenseDoc(parsed.data))
    await expense.save()

    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const result = await Expense.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) {
      return { success: false, error: "Expense not found on your farm." }
    }

    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}
