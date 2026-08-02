"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { dbConnect, Rabbit, WeightLog, Litter, HealthRecord, Cage, RabbitStatus, CageStatus } from "@/database"
import {
  rabbitFormSchema,
  weightLogFormSchema,
  type RabbitFormValues,
  type WeightLogFormValues,
  type RabbitAnalytics,
} from "./types"

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

export async function createRabbit(values: RabbitFormValues): Promise<ActionResult> {
  const parsed = rabbitFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = new Rabbit({ ...toDoc(parsed.data), userId })
    await rabbit.save()

    revalidatePath("/rabbits")
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

    Object.assign(rabbit, toDoc(parsed.data))
    await rabbit.save()

    revalidatePath("/rabbits")
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

    await Rabbit.deleteOne({ _id: id, userId })

    revalidatePath("/rabbits")
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
