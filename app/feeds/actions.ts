"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { dbConnect, FeedType, FeedLog, Expense, ExpenseCategory, PaymentMethod } from "@/database"
import { round2, nonNegative } from "@/database/utils/ownership.util"
import {
  feedTypeFormSchema,
  feedLogFormSchema,
  type FeedTypeFormValues,
  type FeedLogFormValues,
  type FeedLogDirection,
} from "./types"

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
    const anyErr = err as { message?: string; code?: number }
    if (anyErr.code === 11000) return "A feed type with this name already exists."
    if (anyErr.message) return anyErr.message
  }
  return "Something went wrong. Please try again."
}

// ---------------------------------------------------------------------------
// FeedType
// ---------------------------------------------------------------------------

function toFeedTypeDoc(values: FeedTypeFormValues) {
  return {
    name: values.name,
    category: values.category,
    unit: values.unit,
    stockOnHand: values.stockOnHand,
    reorderThreshold: values.reorderThreshold,
    costPerUnit: values.costPerUnit,
    consumptionRatePerRabbit: values.consumptionRatePerRabbit,
    consumptionPeriodDays: values.consumptionPeriodDays,
  }
}

export async function createFeedType(values: FeedTypeFormValues): Promise<ActionResult> {
  const parsed = feedTypeFormSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: "Please fix the highlighted fields." }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const feedType = new FeedType({ ...toFeedTypeDoc(parsed.data), userId })
    await feedType.save()

    revalidatePath("/feeds")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateFeedType(id: string, values: FeedTypeFormValues): Promise<ActionResult> {
  const parsed = feedTypeFormSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: "Please fix the highlighted fields." }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const feedType = await FeedType.findOne({ _id: id, userId })
    if (!feedType) return { success: false, error: "Feed type not found on your farm." }

    Object.assign(feedType, toFeedTypeDoc(parsed.data))
    await feedType.save()

    revalidatePath("/feeds")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteFeedType(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const inUse = await FeedLog.exists({ userId, feedType: id })
    if (inUse) {
      return {
        success: false,
        error:
          "This feed type has log entries against it. Delete those logs first, or keep the feed type for history.",
      }
    }

    const result = await FeedType.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) return { success: false, error: "Feed type not found on your farm." }

    revalidatePath("/feeds")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

// ---------------------------------------------------------------------------
// FeedLog
// ---------------------------------------------------------------------------

/** Signed stock impact of a log entry: restocks add, consumption subtracts. */
function directionDelta(direction: FeedLogDirection, quantity: number): number {
  return direction === "restock" ? quantity : -quantity
}

export async function createFeedLog(values: FeedLogFormValues): Promise<ActionResult> {
  const parsed = feedLogFormSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: "Please fix the highlighted fields." }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const data = parsed.data
    const feedType = await FeedType.findOne({ _id: data.feedType, userId })
    if (!feedType) return { success: false, error: "Feed type not found on your farm." }

    // FeedLog's own post('save') hook syncs FeedType.stockOnHand for new docs.
    const log = new FeedLog({
      userId,
      feedType: data.feedType,
      direction: data.direction,
      quantity: data.quantity,
      rabbitsFed: data.rabbitsFed || undefined,
      cage: data.cage || null,
      date: new Date(data.date),
      notes: data.notes || undefined,
    })
    await log.save()

    if (data.direction === "restock" && data.recordExpense && feedType.costPerUnit) {
      const expense = new Expense({
        userId,
        category: ExpenseCategory.FEED,
        description: `Restock: ${feedType.name}`,
        amount: round2(data.quantity * feedType.costPerUnit),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(data.date),
        relatedFeedType: feedType._id,
        vendor: data.vendor || undefined,
      })
      await expense.save()
    }

    revalidatePath("/feeds")
    revalidatePath("/dashboard")
    revalidatePath("/finances")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateFeedLog(id: string, values: FeedLogFormValues): Promise<ActionResult> {
  const parsed = feedLogFormSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: "Please fix the highlighted fields." }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const data = parsed.data
    const log = await FeedLog.findOne({ _id: id, userId })
    if (!log) return { success: false, error: "Feed log not found on your farm." }

    // The model's stock-sync hook only fires for brand-new documents (see
    // FeedLog_model's post-save comment), so edits to historical logs
    // reconcile FeedType.stockOnHand by hand: undo the old entry's effect,
    // then apply the new one. If the feed type itself changed, each feed
    // type is adjusted independently.
    const oldFeedTypeId = String(log.feedType)
    const newFeedTypeId = data.feedType
    const oldDelta = directionDelta(log.direction, log.quantity)
    const newDelta = directionDelta(data.direction, data.quantity)

    if (oldFeedTypeId === newFeedTypeId) {
      const feedType = await FeedType.findOne({ _id: newFeedTypeId, userId })
      if (!feedType) return { success: false, error: "Feed type not found on your farm." }
      feedType.stockOnHand = nonNegative(round2(feedType.stockOnHand - oldDelta + newDelta))
      await feedType.save()
    } else {
      const [oldFeedType, newFeedType] = await Promise.all([
        FeedType.findOne({ _id: oldFeedTypeId, userId }),
        FeedType.findOne({ _id: newFeedTypeId, userId }),
      ])
      if (!newFeedType) return { success: false, error: "Feed type not found on your farm." }
      if (oldFeedType) {
        oldFeedType.stockOnHand = nonNegative(round2(oldFeedType.stockOnHand - oldDelta))
        await oldFeedType.save()
      }
      newFeedType.stockOnHand = nonNegative(round2(newFeedType.stockOnHand + newDelta))
      await newFeedType.save()
    }

    log.feedType = data.feedType as any
    log.direction = data.direction
    log.quantity = data.quantity
    log.rabbitsFed = data.rabbitsFed || undefined
    log.cage = (data.cage || null) as any
    log.date = new Date(data.date)
    log.notes = data.notes || undefined
    await log.save()

    revalidatePath("/feeds")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteFeedLog(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const log = await FeedLog.findOne({ _id: id, userId })
    if (!log) return { success: false, error: "Feed log not found on your farm." }

    // Reverse this entry's effect on stock before removing it.
    const feedType = await FeedType.findOne({ _id: log.feedType, userId })
    if (feedType) {
      const delta = directionDelta(log.direction, log.quantity)
      feedType.stockOnHand = nonNegative(round2(feedType.stockOnHand - delta))
      await feedType.save()
    }

    await FeedLog.deleteOne({ _id: id, userId })

    revalidatePath("/feeds")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}
