"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/app/litters/columns";
import { LitterFormDialog } from "@/components/litters/litter-form-dialog";
import { LogMortalityDialog } from "@/components/litters/log-mortality-dialog";
import { RecordWeaningDialog } from "@/components/litters/record-weaning-dialog";
import { DeleteLitterDialog } from "@/components/litters/delete-litter-dialog";
import { LittersSummaryStats } from "@/components/litters/litters-summary-stats";
import type { LitterTableData, BreedingOption, LitterAnalyticsSummary } from "@/app/litters/types";
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar";

export function LittersClient({
  initialData,
  breedingOptions,
  analyticsSummary,
}: {
  initialData: LitterTableData[];
  breedingOptions: BreedingOption[];
  analyticsSummary: LitterAnalyticsSummary;
}) {
  const router = useRouter();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingLitter, setEditingLitter] = React.useState<LitterTableData | undefined>(undefined);

  const [mortalityOpen, setMortalityOpen] = React.useState(false);
  const [mortalityLitter, setMortalityLitter] = React.useState<LitterTableData | null>(null);

  const [weaningOpen, setWeaningOpen] = React.useState(false);
  const [weaningLitter, setWeaningLitter] = React.useState<LitterTableData | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<LitterTableData | null>(null);

  // Mirrors whatever the table currently has visible after search + facet
  // filters, so the summary tiles above the table describe "what you're
  // looking at" — same contract as RabbitsClient.
  const [filteredRows, setFilteredRows] = React.useState<LitterTableData[]>(initialData);

  function refresh() {
    router.refresh();
  }

  const facets: FacetedFilterConfig[] = React.useMemo(() => {
    const uniq = (values: (string | undefined)[]) =>
      Array.from(new Set(values.filter((v): v is string => !!v))).sort();

    return [
      {
        columnId: "status",
        title: "Status",
        options: [
          { label: "Active (nursing)", value: "active" },
          { label: "Weaned", value: "weaned" },
        ],
      },
      {
        columnId: "breedName",
        title: "Breed",
        options: uniq(initialData.map((r) => r.breedName)).map((v) => ({ label: v, value: v })),
      },
      {
        columnId: "doeName",
        title: "Doe",
        options: uniq(initialData.map((r) => r.doeName)).map((v) => ({ label: v, value: v })),
      },
      {
        columnId: "buckName",
        title: "Buck",
        options: uniq(initialData.map((r) => r.buckName)).map((v) => ({ label: v, value: v })),
      },
      {
        columnId: "mortalityCount",
        title: "Mortality",
        options: [
          { label: "Has losses", value: "has_losses" },
          { label: "No losses", value: "no_losses" },
        ],
      },
    ];
  }, [initialData]);

  return (
    <>
      <LittersSummaryStats filteredRows={filteredRows} serverSummary={analyticsSummary}/>

      <DataTable
        columns={columns}
        data={initialData}
        searchPlaceholder="Search doe, buck, breed, notes…"
        searchableRowAsString={(r) =>
          [r.doeName, r.doeTagNumber, r.buckName, r.buckTagNumber, r.breedName, r.notes ?? ""]
            .filter(Boolean)
            .join(" ")
        }
        facets={facets}
        emptyMessage="No litters yet — record your first kindling to get started."
        onFilteredRowsChange={setFilteredRows}
        toolbarActions={
          <Button
            size="sm"
            className="h-8"
            onClick={() => {
              setEditingLitter(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Record litter
          </Button>
        }
        meta={{
          onEdit: (litter) => {
            setEditingLitter(litter);
            setFormOpen(true);
          },
          onLogMortality: (litter) => {
            setMortalityLitter(litter);
            setMortalityOpen(true);
          },
          onRecordWeaning: (litter) => {
            setWeaningLitter(litter);
            setWeaningOpen(true);
          },
          onDelete: (litter) => {
            setDeleteTarget(litter);
            setDeleteOpen(true);
          },
        }}
      />

      <LitterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        breedingOptions={breedingOptions}
        litter={editingLitter}
        onSaved={refresh}
      />

      <LogMortalityDialog
        open={mortalityOpen}
        onOpenChange={setMortalityOpen}
        litter={mortalityLitter}
        onSaved={refresh}
      />

      <RecordWeaningDialog
        open={weaningOpen}
        onOpenChange={setWeaningOpen}
        litter={weaningLitter}
        onSaved={refresh}
      />

      <DeleteLitterDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        litter={deleteTarget}
        onDeleted={refresh}
      />
    </>
  );
}
