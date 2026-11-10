import type { BreedingMethod, BreedingStatus } from "@/types/enums";

export interface BreedingOption {
  id: string;
  name: string;
  tagNumber: string;
}

export interface BreedingTableData {
  id: string;
  doeId: string;
  doeName: string;
  doeTagNumber: string;
  buckId: string;
  buckName: string;
  buckTagNumber: string;
  method: BreedingMethod;
  pairedDate: string;
  expectedDueDate: string;
  status: BreedingStatus;
  confirmedPregnantDate: string | null;
  actualKindleDate: string | null;
  failureReason: string | null;
  notes: string | null;
  litterId: string | null;
  isOverdue: boolean;
}