import "server-only"
import { auth } from "@clerk/nextjs/server"
import {
  dbConnect,
  Rabbit,
  Breed,
  Cage,
  Gender,
  RabbitStatus,
  CageStatus,
  CageType,
} from "@/database"
import type { RabbitTableData, RabbitFormOptions, SelectOption } from "@/app/rabbits/types"

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("You must be signed in to view farm data.")
  }
  return userId
}

function daysBetween(start: Date, end: Date = new Date()): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000)
}

/** Fetches every rabbit for the signed-in farm, flattened for the data table. */
export async function getRabbitsForTable(): Promise<RabbitTableData[]> {
  const userId = await getAuthUserId()
  await dbConnect()

  const rabbits = await Rabbit.find({ userId })
    .populate("breed", "name")
    .populate("cage", "label")
    .populate("sire", "name tagNumber")
    .populate("dam", "name tagNumber")
    .sort({ createdAt: -1 })
    .lean<any[]>()

  return rabbits.map((r): RabbitTableData => ({
    id: String(r._id),
    tagNumber: r.tagNumber,
    name: r.name,
    breedId: String(r.breed?._id ?? r.breed ?? ""),
    breedName: r.breed?.name ?? "Unknown",
    gender: r.gender,
    dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toISOString() : undefined,
    ageDays: r.dateOfBirth ? daysBetween(new Date(r.dateOfBirth)) : undefined,
    status: r.status,
    healthStatus: r.healthStatus,
    sireId: r.sire ? String(r.sire._id ?? r.sire) : undefined,
    sireName: r.sire ? r.sire.name ?? r.sire.tagNumber : undefined,
    damId: r.dam ? String(r.dam._id ?? r.dam) : undefined,
    damName: r.dam ? r.dam.name ?? r.dam.tagNumber : undefined,
    acquisitionType: r.acquisitionType,
    acquisitionDate: new Date(r.acquisitionDate).toISOString(),
    sourceFarm: r.sourceFarm,
    acquisitionCost: r.acquisitionCost,
    purpose: r.purpose,
    cageId: r.cage ? String(r.cage._id ?? r.cage) : undefined,
    cageLabel: r.cage?.label,
    currentWeightKg: r.currentWeightKg,
    lastWeighedAt: r.lastWeighedAt ? new Date(r.lastWeighedAt).toISOString() : undefined,
    color: r.color,
    markings: r.markings,
    notes: r.notes,
  }))
}

/** Dropdown options (breeds, cages, candidate sires/dams) for the create/edit form. */
export async function getRabbitFormOptions(): Promise<RabbitFormOptions> {
  const userId = await getAuthUserId()
  await dbConnect()

  const cageLabels = Array.from({ length: 26 }, (_, row) =>
    Array.from({ length: 12 }, (_, column) => `${String.fromCharCode(65 + row)}${column + 1}`)
  ).flat()

  await Cage.bulkWrite(
    cageLabels.map((label) => ({
      updateOne: {
        filter: { userId, label },
        update: {
          $setOnInsert: {
            userId,
            label,
            type: CageType.BREEDING,
            status: CageStatus.EMPTY,
            capacity: 1,
          },
        },
        upsert: true,
      },
    }))
  )

  const [breeds, cages, occupiedCageIds, bucks, does] = await Promise.all([
    Breed.find({ userId }).sort({ name: 1 }).select("name").lean<any[]>(),
    Cage.find({ userId, label: { $in: cageLabels } })
      .select("label")
      .lean<any[]>(),
    Rabbit.find({ userId, cage: { $ne: null } })
      .distinct("cage"),
    Rabbit.find({ userId, gender: Gender.MALE, status: RabbitStatus.ACTIVE })
      .select("name tagNumber")
      .sort({ tagNumber: 1 })
      .lean<any[]>(),
    Rabbit.find({ userId, gender: Gender.FEMALE, status: RabbitStatus.ACTIVE })
      .select("name tagNumber")
      .sort({ tagNumber: 1 })
      .lean<any[]>(),
  ])

  const toOption = (r: any): SelectOption => ({
    value: String(r._id),
    label: r.name ? `${r.name} (${r.tagNumber})` : r.tagNumber,
  })

  return {
    breeds: breeds.map((b) => ({ value: String(b._id), label: b.name })),
    cages: cages
      .filter((c) => !occupiedCageIds.some((id) => String(id) === String(c._id)))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
      .map((c) => ({ value: String(c._id), label: c.label })),
    bucks: bucks.map(toOption),
    does: does.map(toOption),
  }
}
