"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/app/breeding/columns";
import { BreedingFormDialog } from "@/components/breeding/breeding-form-dialog";
import { BreedingStatusDialog } from "@/components/breeding/breeding-status-dialog";
import { DeleteBreedingDialog } from "@/components/breeding/delete-breeding-dialog";
import { BreedingsSummaryStats } from "@/components/breeding/breedings-summary-stats";
import { BreedingStatus } from "@/types/enums";
import type { BreedingOption, BreedingTableData } from "@/app/breeding/types";
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar";

function titleCase(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }

export function BreedingsClient({ initialData, options }: { initialData: BreedingTableData[]; options: { does: BreedingOption[]; bucks: BreedingOption[] } }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [statusTarget, setStatusTarget] = React.useState<BreedingTableData | null>(null);
  const [editingBreeding, setEditingBreeding] = React.useState<BreedingTableData | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<BreedingTableData | null>(null);
  const [filteredRows, setFilteredRows] = React.useState<BreedingTableData[]>(initialData);
  const facets: FacetedFilterConfig[] = React.useMemo(() => [{ columnId: "status", title: "Status", options: Object.values(BreedingStatus).map((status) => ({ label: titleCase(status), value: status })) }], []);
  function refresh() { router.refresh(); }
  return <>
    <BreedingsSummaryStats breedings={filteredRows} />
    <DataTable columns={columns} data={initialData} searchPlaceholder="Search doe, buck, notes…" searchableRowAsString={(row) => [row.doeName, row.doeTagNumber, row.buckName, row.buckTagNumber, row.status, row.failureReason, row.notes].filter(Boolean).join(" ")} facets={facets} emptyMessage="No mating records yet — record your first mating to get started." onFilteredRowsChange={setFilteredRows} toolbarActions={<Button size="sm" className="h-8" onClick={() => { setEditingBreeding(undefined); setFormOpen(true); }}><Plus className="mr-2 h-3.5 w-3.5" />Record mating</Button>} meta={{ onUpdateStatus: (row) => { setStatusTarget(row); setStatusOpen(true); }, onEdit: (row) => { setEditingBreeding(row); setFormOpen(true); }, onDelete: (row) => { setDeleteTarget(row); setDeleteOpen(true); } }} />
    <BreedingFormDialog open={formOpen} onOpenChange={setFormOpen} options={options} breeding={editingBreeding} onSaved={refresh} />
    <BreedingStatusDialog open={statusOpen} onOpenChange={setStatusOpen} breeding={statusTarget} onSaved={refresh} />
    <DeleteBreedingDialog open={deleteOpen} onOpenChange={setDeleteOpen} breeding={deleteTarget} onDeleted={refresh} />
  </>;
}