"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { dbConnect, Cage, Rabbit, RabbitStatus } from "@/database"
import {
  cageFormSchema,
  type CageFormValues,
  type CageOccupant,
  type AssignableRabbitOption,
} from "./types"

export interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Partial<Record<keyof CageFormValues, string>>
}

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  return userId
}

function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { code?: number; message?: string }
    if (anyErr.code === 11000) {
      return "A cage with this label already exists on your farm."
    }
    if (anyErr.message) return anyErr.message
  }
  return "Something went wrong. Please try again."
}

function toDoc(values: CageFormValues) {
  return {
    label: values.label,
    type: values.type,
    ...(values.status ? { status: values.status } : {}),
    capacity: values.capacity,
    location: values.location || undefined,
    notes: values.notes || undefined,
  }
}

export async function createCage(values: CageFormValues): Promise<ActionResult> {
  const parsed = cageFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    await Cage.create({ ...toDoc(parsed.data), userId })

    revalidatePath("/cage-cards")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateCage(id: string, values: CageFormValues): Promise<ActionResult> {
  const parsed = cageFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const cage = await Cage.findOne({ _id: id, userId })
    if (!cage) {
      return { success: false, error: "Cage not found on your farm." }
    }

    Object.assign(cage, toDoc(parsed.data))
    await cage.save()

    revalidatePath("/cage-cards")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteCage(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    // Guard against orphaning active rabbits — deleting a cage they still
    // point at wouldn't clear their `cage` field, just leave it dangling.
    const occupantCount = await Rabbit.countDocuments({
      userId,
      cage: id,
      status: RabbitStatus.ACTIVE,
    })
    if (occupantCount > 0) {
      return {
        success: false,
        error: `Can't delete — ${occupantCount} active rabbit${occupantCount === 1 ? "" : "s"} still assigned here. Vacate it first.`,
      }
    }

    const result = await Cage.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) {
      return { success: false, error: "Cage not found on your farm." }
    }

    revalidatePath("/cage-cards")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/**
 * Assigns (or moves) a rabbit into a cage. Only touches Rabbit.cage — the
 * Rabbit model's own save hooks (syncCageOccupancy) take care of updating
 * both the destination cage AND freeing whatever cage the rabbit was
 * previously in, so this action doesn't need to know or care about that.
 */
export async function assignRabbitToCage(cageId: string, rabbitId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const [cage, rabbit, occupantCount] = await Promise.all([
      Cage.findOne({ _id: cageId, userId }),
      Rabbit.findOne({ _id: rabbitId, userId }),
      Rabbit.countDocuments({ userId, cage: cageId, status: RabbitStatus.ACTIVE }),
    ])

    if (!cage) return { success: false, error: "Cage not found on your farm." }
    if (!rabbit) return { success: false, error: "Rabbit not found on your farm." }
    if (occupantCount >= cage.capacity) {
      return { success: false, error: `${cage.label} is already at full capacity (${cage.capacity}).` }
    }

    rabbit.cage = cage._id
    await rabbit.save()

    revalidatePath("/cage-cards")
    revalidatePath("/rabbits")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/** Clears a rabbit's cage assignment. The save hook frees the cage it left. */
export async function vacateRabbit(rabbitId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbit = await Rabbit.findOne({ _id: rabbitId, userId })
    if (!rabbit) {
      return { success: false, error: "Rabbit not found on your farm." }
    }

    rabbit.cage = null
    await rabbit.save()

    revalidatePath("/cage-cards")
    revalidatePath("/rabbits")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export interface CageOccupantsResult {
  success: boolean
  data?: CageOccupant[]
  error?: string
}

/**
 * Live occupant list for the detail dialog. Queried directly from Rabbit —
 * same reasoning as the page-level data fetcher: Cage.currentRabbit can
 * only ever name one occupant, so it's not a usable source for this.
 */
export async function getCageOccupants(cageId: string): Promise<CageOccupantsResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbits = await Rabbit.find({ userId, cage: cageId, status: RabbitStatus.ACTIVE })
      .populate("breed", "name")
      .select("tagNumber name gender breed")
      .sort({ tagNumber: 1 })
      .lean<any[]>()

    return {
      success: true,
      data: rabbits.map((r) => ({
        id: String(r._id),
        tagNumber: r.tagNumber,
        name: r.name,
        gender: r.gender,
        breedName: (r.breed as any)?.name ?? "Unknown",
      })),
    }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export interface AssignableRabbitsResult {
  success: boolean
  data?: AssignableRabbitOption[]
  error?: string
}

/**
 * Active rabbits eligible to be assigned to `excludeCageId` — i.e. every
 * active rabbit not already in that specific cage. Rabbits currently in a
 * *different* cage are included deliberately: picking one here reads as
 * "move this rabbit," which assignRabbitToCage supports for free since the
 * hook frees the old cage automatically.
 */
export async function getAssignableRabbits(excludeCageId: string): Promise<AssignableRabbitsResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const rabbits = await Rabbit.find({
      userId,
      status: RabbitStatus.ACTIVE,
      cage: { $ne: excludeCageId },
    })
      .populate("cage", "label")
      .select("tagNumber name cage")
      .sort({ tagNumber: 1 })
      .lean<any[]>()

    return {
      success: true,
      data: rabbits.map((r) => ({
        value: String(r._id),
        label: r.name ? `${r.name} (#${r.tagNumber})` : `#${r.tagNumber}`,
        currentCageLabel: (r.cage as any)?.label,
      })),
    }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}
