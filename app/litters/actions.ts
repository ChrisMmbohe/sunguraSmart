"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { dbConnect, Litter, Breeding, BreedingStatus } from "@/database";
import { assertOwnedByUser } from "@/database/utils/ownership.util";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof z.ZodError) {
    return { ok: false, error: err.issues[0]?.message ?? "Invalid input." };
  }
  return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
}

// ---------------------------------------------------------------------------
// Create litter (from a paired / confirmed-pregnant Breeding)
// ---------------------------------------------------------------------------

const createLitterSchema = z.object({
  breedingId: z.string().min(1, "Select a breeding pair."),
  kindleDate: z.coerce.date(),
  kitsBornAlive: z.coerce.number().int().min(0),
  kitsBornDead: z.coerce.number().int().min(0),
  notes: z.string().trim().optional(),
});

export type CreateLitterInput = z.infer<typeof createLitterSchema>;

export async function createLitterAction(input: CreateLitterInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();
    const parsed = createLitterSchema.parse(input);
    await dbConnect();

    const breeding = await Breeding.findOne({ _id: parsed.breedingId, userId });
    assertOwnedByUser(breeding, userId, "Breeding pair");
    if (breeding!.litter) {
      throw new Error("This breeding pair already has a litter recorded.");
    }

    const litter = await Litter.create({
      userId,
      breeding: breeding!._id,
      doe: breeding!.doe,
      buck: breeding!.buck,
      kindleDate: parsed.kindleDate,
      kitsBornAlive: parsed.kitsBornAlive,
      kitsBornDead: parsed.kitsBornDead,
      notes: parsed.notes,
    });
    // Litter's post-save hook syncs Breeding.status -> KINDLED automatically.

    revalidatePath("/litters");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: String(litter._id) } };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Edit litter basics (born counts / kindle date / notes)
// ---------------------------------------------------------------------------

const updateLitterSchema = z.object({
  litterId: z.string().min(1),
  kindleDate: z.coerce.date(),
  kitsBornAlive: z.coerce.number().int().min(0),
  kitsBornDead: z.coerce.number().int().min(0),
  notes: z.string().trim().optional(),
});

export type UpdateLitterInput = z.infer<typeof updateLitterSchema>;

export async function updateLitterAction(input: UpdateLitterInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = updateLitterSchema.parse(input);
    await dbConnect();

    const litter = await Litter.findOne({ _id: parsed.litterId, userId });
    assertOwnedByUser(litter, userId, "Litter");

    litter!.kindleDate = parsed.kindleDate;
    litter!.kitsBornAlive = parsed.kitsBornAlive;
    litter!.kitsBornDead = parsed.kitsBornDead;
    litter!.notes = parsed.notes;
    await litter!.save(); // re-runs mortality/weaned-count consistency checks

    revalidatePath("/litters");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Log a mortality event
// ---------------------------------------------------------------------------

const logMortalitySchema = z.object({
  litterId: z.string().min(1),
  date: z.coerce.date(),
  count: z.coerce.number().int().min(1, "Count must be at least 1."),
  cause: z.string().trim().optional(),
});

export type LogMortalityInput = z.infer<typeof logMortalitySchema>;

export async function logMortalityAction(input: LogMortalityInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = logMortalitySchema.parse(input);
    await dbConnect();

    const litter = await Litter.findOne({ _id: parsed.litterId, userId });
    assertOwnedByUser(litter, userId, "Litter");

    litter!.mortalityEvents.push({
      date: parsed.date,
      count: parsed.count,
      cause: parsed.cause,
    });
    await litter!.save(); // pre-save hook rejects if losses exceed kits born alive

    revalidatePath("/litters");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Record weaning
// ---------------------------------------------------------------------------

const recordWeaningSchema = z.object({
  litterId: z.string().min(1),
  weaningDate: z.coerce.date(),
  kitsWeaned: z.coerce.number().int().min(0),
});

export type RecordWeaningInput = z.infer<typeof recordWeaningSchema>;

export async function recordWeaningAction(input: RecordWeaningInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = recordWeaningSchema.parse(input);
    await dbConnect();

    const litter = await Litter.findOne({ _id: parsed.litterId, userId });
    assertOwnedByUser(litter, userId, "Litter");

    litter!.weaningDate = parsed.weaningDate;
    litter!.kitsWeaned = parsed.kitsWeaned;
    await litter!.save(); // post-save hook flips Breeding.status -> WEANED

    revalidatePath("/litters");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Delete litter
// ---------------------------------------------------------------------------

export async function deleteLitterAction(litterId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await dbConnect();

    const litter = await Litter.findOne({ _id: litterId, userId });
    assertOwnedByUser(litter, userId, "Litter");

    await Litter.deleteOne({ _id: litterId, userId });

    // Best-effort revert of the parent Breeding so it re-enters the
    // "due soon" / "overdue" pipeline instead of being stuck as kindled.
    await Breeding.findOneAndUpdate(
      { _id: litter!.breeding, userId },
      {
        litter: null,
        status: BreedingStatus.CONFIRMED_PREGNANT,
        actualKindleDate: undefined,
      }
    );

    revalidatePath("/litters");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
