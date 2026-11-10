"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import {
  dbConnect,
  Rabbit,
  Breed,
  WeightLog,
  Litter,
  HealthRecord,
  Cage,
  Expense,
  RabbitStatus,
  CageStatus,
  AcquisitionType,
  ExpenseCategory,
  PaymentMethod,
} from "@/database"
import {
  breedFormSchema,
  rabbitFormSchema,
  weightLogFormSchema,
  type RabbitFormValues,
  type BreedFormValues,
  type WeightLogFormValues,
  type RabbitAnalytics,
} from "./types"

export interface BreedActionResult {
  success: boolean
  data?: { id: string; name: string }
  error?: string
}

export interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Partial<Record<keyof RabbitFormValues, string>>
}

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  return userId
}

export async function createBreed(values: BreedFormValues): Promise<BreedActionResult> {
  const parsed = breedFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Enter a valid breed name." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const breed = await Breed.create({ userId, ...parsed.data })
    revalidatePath("/rabbits")

    return { success: true, data: { id: String(breed._id), name: breed.name } }
  } catch (err) {
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      return { success: false, error: "A breed with this name already exists on your farm." }
    }
    return { success: false, error: "Could not add the breed. Please try again." }
  }
}

/** Turns a Mongoose duplicate-key / validation error into a friendly message. */
function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { code?: number; message?: string }
    if (anyErr.code === 11000) {
      return "A rabbit with this tag number already exists on your farm."
    }
    if (anyErr.message) return anyErr.message
  }
  return "Something went wrong. Please try again."
}

function toDoc(values: RabbitFormValues) {
  return {
    tagNumber: values.tagNumber,
    name: values.name || undefined,
    breed: values.breed,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : undefined,
    status: values.status,
    healthStatus: values.healthStatus,
    acquisitionType: values.acquisitionType,
    acquisitionDate: new Date(values.acquisitionDate),
    sourceFarm: values.sourceFarm || undefined,
    acquisitionCost: values.acquisitionCost,
    purpose: values.purpose,
    cage: values.cage || null,
    sire: values.sire || null,
    dam: values.dam || null,
    color: values.color || undefined,
    markings: values.markings || undefined,
    notes: values.notes || undefined,
  }
}

async function syncRabbitPurchaseExpense(userId: string, rabbitId: string, values: RabbitFormValues) {
  const expense = await Expense.findOne({ userId, relatedRabbit: rabbitId, rabbitAcquisition: true })
  const shouldExist = values.acquisitionType === AcquisitionType.PURCHASED && values.acquisitionCost !== undefined

  if (!shouldExist) {
    if (expense) await expense.deleteOne()
    return
  }

  const expenseDoc = {
    category: ExpenseCategory.BREEDING_STOCK,
    description: `Purchase of rabbit ${values.tagNumber}`,
    amount: values.acquisitionCost,
    paymentMethod: PaymentMethod.CASH,
    date: new Date(values.acquisitionDate),
    relatedRabbit: rabbitId,
    rabbitAcquisition: true,
    vendor: values.sourceFarm || undefined,
  }

  if (expense) {
    Object.assign(expense, expenseDoc)
    await expense.save()
  } else {
    await Expense.create({ ...expenseDoc, userId })
  }
}

export async function createRabbit(values: RabbitFormValues): Promise<ActionResult> {
  const parsed = rabbitFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = new Rabbit({ ...toDoc(parsed.data), userId })
    if (parsed.data.cage) {
      const cageInUse = await Rabbit.exists({
        userId,
        cage: parsed.data.cage,
      })
      if (cageInUse) return { success: false, error: "That cage is already assigned to an active rabbit." }
    }
    await rabbit.save()
    await syncRabbitPurchaseExpense(userId, String(rabbit._id), parsed.data)

    revalidatePath("/rabbits")
    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateRabbit(id: string, values: RabbitFormValues): Promise<ActionResult> {
  const parsed = rabbitFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = await Rabbit.findOne({ _id: id, userId })
    if (!rabbit) {
      return { success: false, error: "Rabbit not found on your farm." }
    }

    if (parsed.data.cage && String(rabbit.cage ?? "") !== parsed.data.cage) {
      const cageInUse = await Rabbit.exists({
        userId,
        cage: parsed.data.cage,
        _id: { $ne: rabbit._id },
      })
      if (cageInUse) return { success: false, error: "That cage is already assigned to an active rabbit." }
    }

    Object.assign(rabbit, toDoc(parsed.data))
    await rabbit.save()
    await syncRabbitPurchaseExpense(userId, String(rabbit._id), parsed.data)

    revalidatePath("/rabbits")
    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteRabbit(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = await Rabbit.findOne({ _id: id, userId })
    if (!rabbit) {
      return { success: false, error: "Rabbit not found on your farm." }
    }

    // Release the cage *before* deleting the rabbit — once the document is
    // gone there's nothing left to drive a hook that could do this for us,
    // so it has to happen explicitly here or the cage is left permanently
    // marked "occupied" by a rabbit that no longer exists.
    if (rabbit.cage) {
      await Cage.findOneAndUpdate(
        { _id: rabbit.cage, userId },
        { currentRabbit: null, status: CageStatus.EMPTY }
      )
    }

    await Expense.deleteOne({ userId, relatedRabbit: rabbit._id, rabbitAcquisition: true })
    await Rabbit.deleteOne({ _id: id, userId })

    revalidatePath("/rabbits")
    revalidatePath("/finances")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function logWeight(rabbitId: string, values: WeightLogFormValues): Promise<ActionResult> {
  const parsed = weightLogFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid weight and date." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = await Rabbit.findOne({ _id: rabbitId, userId })
    if (!rabbit) {
      return { success: false, error: "Rabbit not found on your farm." }
    }

    await WeightLog.create({
      userId,
      rabbit: rabbit._id,
      weightKg: parsed.data.weightKg,
      recordedAt: new Date(parsed.data.recordedAt),
      notes: parsed.data.notes || undefined,
    })

    revalidatePath("/rabbits")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/**
 * Quick status change (e.g. retire, mark deceased, mark sold) triggered
 * from the row actions menu, after the user has confirmed the change in
 * ConfirmStatusChangeDialog. Cage release for terminal statuses is handled
 * automatically by the Rabbit model's pre/post-save hooks.
 */
export async function setRabbitStatus(id: string, status: RabbitStatus): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = await Rabbit.findOne({ _id: id, userId })
    if (!rabbit) {
      return { success: false, error: "Rabbit not found on your farm." }
    }

    rabbit.status = status
    await rabbit.save()

    revalidatePath("/rabbits")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export interface AnalyticsResult {
  success: boolean
  data?: RabbitAnalytics
  error?: string
}

function daysBetween(start: Date, end: Date = new Date()): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000)
}

/**
 * On-demand analytics for a single rabbit: weight history (for the growth
 * chart), breeding productivity if it's been used as a doe/buck, and a
 * health record summary. Fetched lazily when the analytics dialog opens
 * rather than upfront for every row in the table.
 */
export async function getRabbitAnalytics(rabbitId: string): Promise<AnalyticsResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = await Rabbit.findOne({ _id: rabbitId, userId })
    if (!rabbit) {
      return { success: false, error: "Rabbit not found on your farm." }
    }

    const [weightLogs, litters, healthRecordCount, lastHealthRecord] = await Promise.all([
      WeightLog.find({ userId, rabbit: rabbit._id }).sort({ recordedAt: 1 }).lean<any[]>(),
      Litter.find({ userId, $or: [{ doe: rabbit._id }, { buck: rabbit._id }] })
        .sort({ kindleDate: 1 })
        .lean<any[]>(),
      HealthRecord.countDocuments({ userId, rabbit: rabbit._id }),
      HealthRecord.findOne({ userId, rabbit: rabbit._id }).sort({ date: -1 }).lean<any>(),
    ])

    const weightHistory = weightLogs.map((w) => ({
      date: new Date(w.recordedAt).toISOString(),
      weightKg: w.weightKg,
    }))

    let weightTrend: RabbitAnalytics["weightTrend"] = null
    if (weightHistory.length >= 2) {
      const prev = weightHistory[weightHistory.length - 2].weightKg
      const latest = weightHistory[weightHistory.length - 1].weightKg
      const deltaKg = Math.round((latest - prev) * 100) / 100
      weightTrend = { deltaKg, deltaPct: prev > 0 ? Math.round((deltaKg / prev) * 1000) / 10 : 0 }
    }

    const litterCount = litters.length
    const totalOffspring = litters.reduce((sum, l) => sum + (l.kitsBornAlive ?? 0), 0)
    const littersAsDam = litters.filter((l) => String(l.doe) === String(rabbit._id))
    const avgLitterSize =
      littersAsDam.length > 0
        ? Math.round((littersAsDam.reduce((sum, l) => sum + (l.kitsBornAlive ?? 0), 0) / littersAsDam.length) * 10) / 10
        : null

    const data: RabbitAnalytics = {
      weightHistory,
      latestWeightKg: weightHistory.length ? weightHistory[weightHistory.length - 1].weightKg : undefined,
      weightTrend,
      ageDays: rabbit.dateOfBirth ? daysBetween(rabbit.dateOfBirth) : undefined,
      daysOnFarm: daysBetween(rabbit.acquisitionDate),
      litterCount,
      totalOffspring,
      avgLitterSize,
      healthRecordCount,
      lastHealthEvent: lastHealthRecord
        ? {
            type: lastHealthRecord.type,
            date: new Date(lastHealthRecord.date).toISOString(),
            outcome: lastHealthRecord.outcome,
          }
        : null,
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}
