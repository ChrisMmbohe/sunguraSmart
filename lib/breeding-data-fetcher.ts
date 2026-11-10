import "server-only";

import { auth } from "@clerk/nextjs/server";
import { dbConnect, Breeding, Gender, Rabbit, RabbitStatus } from "@/database";
import type { BreedingOption, BreedingTableData } from "@/app/breeding/types";

type RabbitOptionRecord = { _id: unknown; name?: string; tagNumber: string };
type PopulatedRabbit = { _id?: unknown; name?: string; tagNumber?: string } | string;
type BreedingRecord = {
  _id: unknown;
  doe: PopulatedRabbit;
  buck: PopulatedRabbit;
  method: BreedingTableData["method"];
  pairedDate: Date;
  expectedDueDate: Date;
  status: BreedingTableData["status"];
  confirmedPregnantDate?: Date;
  actualKindleDate?: Date;
  failureReason?: string;
  notes?: string;
  litter?: unknown;
};

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

export async function getBreedingOptions(): Promise<{ does: BreedingOption[]; bucks: BreedingOption[] }> {
  const userId = await requireUserId();
  await dbConnect();
  const [does, bucks] = await Promise.all([
    Rabbit.find({ userId, gender: Gender.FEMALE, status: RabbitStatus.ACTIVE }).select("name tagNumber").sort({ tagNumber: 1 }).lean<RabbitOptionRecord[]>(),
    Rabbit.find({ userId, gender: Gender.MALE, status: RabbitStatus.ACTIVE }).select("name tagNumber").sort({ tagNumber: 1 }).lean<RabbitOptionRecord[]>(),
  ]);
  const toOption = (rabbit: RabbitOptionRecord): BreedingOption => ({ id: String(rabbit._id), name: rabbit.name ?? "", tagNumber: rabbit.tagNumber });
  return { does: does.map(toOption), bucks: bucks.map(toOption) };
}

export async function getBreedingsForTable(): Promise<BreedingTableData[]> {
  const userId = await requireUserId();
  await dbConnect();
  const breedings = await Breeding.find({ userId })
    .populate("doe", "name tagNumber")
    .populate("buck", "name tagNumber")
    .sort({ pairedDate: -1 })
    .lean<BreedingRecord[]>();
  const now = Date.now();
  return breedings.map((breeding): BreedingTableData => ({
    id: String(breeding._id),
    doeId: String(typeof breeding.doe === "string" ? breeding.doe : breeding.doe?._id),
    doeName: typeof breeding.doe === "string" ? "Doe" : breeding.doe?.name ?? "Doe",
    doeTagNumber: typeof breeding.doe === "string" ? "" : breeding.doe?.tagNumber ?? "",
    buckId: String(typeof breeding.buck === "string" ? breeding.buck : breeding.buck?._id),
    buckName: typeof breeding.buck === "string" ? "Buck" : breeding.buck?.name ?? "Buck",
    buckTagNumber: typeof breeding.buck === "string" ? "" : breeding.buck?.tagNumber ?? "",
    method: breeding.method,
    pairedDate: new Date(breeding.pairedDate).toISOString(),
    expectedDueDate: new Date(breeding.expectedDueDate).toISOString(),
    status: breeding.status,
    confirmedPregnantDate: breeding.confirmedPregnantDate ? new Date(breeding.confirmedPregnantDate).toISOString() : null,
    actualKindleDate: breeding.actualKindleDate ? new Date(breeding.actualKindleDate).toISOString() : null,
    failureReason: breeding.failureReason ?? null,
    notes: breeding.notes ?? null,
    litterId: breeding.litter ? String(breeding.litter) : null,
    isOverdue: breeding.expectedDueDate.getTime() < now && ["paired", "confirmed_pregnant"].includes(breeding.status),
  }));
}