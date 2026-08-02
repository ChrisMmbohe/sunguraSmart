// app/litters/types.ts
// Client-safe types only — no mongoose imports here (see barrel-boundary note
// in database/index.ts). Import enums directly from '@/types/enums'.

export interface LitterMortalityEventDTO {
  date: string; // ISO
  count: number;
  cause?: string;
}

export type LitterStatus = "active" | "weaned";

export interface LitterTableData {
  id: string;
  breedingId: string;

  doeId: string;
  doeName: string; // name || tagNumber
  doeTagNumber: string;

  buckId: string;
  buckName: string;
  buckTagNumber: string;

  breedId: string;
  breedName: string;

  kindleDate: string; // ISO
  kitsBornAlive: number;
  kitsBornDead: number;
  mortalityCount: number;
  kitsAlive: number; // bornAlive - mortalityCount
  kitsWeaned: number | null;
  weaningDate: string | null;

  status: LitterStatus;
  survivalRatePct: number | null; // only meaningful once weaned
  hasLosses: boolean;

  mortalityEvents: LitterMortalityEventDTO[];
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

/** A Breeding record eligible to be turned into a Litter (paired/confirmed
 *  pregnant, no litter recorded yet). Powers the "Record New Litter" dialog. */
export interface BreedingOption {
  id: string;
  doeId: string;
  doeName: string;
  buckId: string;
  buckName: string;
  pairedDate: string;
  expectedDueDate: string;
  status: string;
  isOverdue: boolean;
}

export interface LitterAnalyticsSummary {
  totalLitters: number;
  activeLitters: number;
  weanedLitters: number;
  avgLitterSize: number; // avg kitsBornAlive across all litters
  avgWeaningSurvivalRate: number; // 0-1, weaned litters only
  kitsBornThisMonth: number;
  totalKitsBornAlive: number;
  totalKitsBornDead: number;
  totalMortality: number;
  totalWeaned: number;
  stillbirthRatePct: number; // bornDead / (bornAlive + bornDead)
}
