import { z } from "zod"
import { CageType, CageStatus, Gender } from "@/types/enums"

/**
 * One occupant of a cage, resolved server-side from a live query against
 * Rabbit (status: ACTIVE, cage: this cage) — never from Cage.currentRabbit,
 * which can only ever name a single rabbit and can't represent a
 * multi-capacity cage's full occupant list.
 */
export interface CageOccupant {
  id: string
  tagNumber: string
  name?: string
  gender: Gender
  breedName: string
}

/** Flattened, card-friendly view of a Cage document plus its live occupants. */
export interface CageCardData {
  id: string
  label: string
  type: CageType
  status: CageStatus
  capacity: number
  location?: string
  notes?: string
  occupants: CageOccupant[]
  occupantCount: number
  isFull: boolean
  createdAt: string
  updatedAt: string
}

export interface CageSummary {
  totalCages: number
  occupiedCages: number
  emptyCages: number
  totalCapacity: number
  occupiedSlots: number
  availableSlots: number
  occupancyPct: number
}

/** Lightweight option shape for the "assign a rabbit" select. */
export interface SelectOption {
  value: string
  label: string
}

/** Extends SelectOption with the rabbit's current cage, if any — shown in
 *  the select so assigning it here reads as "moving" rather than a silent
 *  reassignment. */
export interface AssignableRabbitOption extends SelectOption {
  currentCageLabel?: string
}

// ---------------------------------------------------------------------------
// Validation — shared between the client form and the server actions.
// ---------------------------------------------------------------------------

export const cageFormSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60),
  type: z.nativeEnum(CageType),
  // Status is normally derived automatically from live occupancy (see
  // Rabbit_model.ts syncCageOccupancy) — this is only exposed in the edit
  // form for manual states like maintenance, and is optional so create
  // doesn't need to guess a value.
  status: z.nativeEnum(CageStatus).optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(50),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
})

export type CageFormValues = z.infer<typeof cageFormSchema>
