"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/app/rabbits/columns"
import { RabbitFormDialog } from "@/components/rabbits/rabbit-form-dialog"
import { LogWeightDialog } from "@/components/rabbits/log-weight-dialog"
import { DeleteRabbitDialog } from "@/components/rabbits/delete-rabbit-dialog"
import { RabbitAnalyticsDialog } from "@/components/rabbits/rabbit-analytics-dialog"
import { ConfirmStatusChangeDialog } from "@/components/rabbits/confirm-status-change-dialog"
import { RabbitsSummaryStats } from "@/components/rabbits/rabbits-summary-stats"
import { RabbitStatus, HealthStatus, RabbitPurpose, Gender } from "@/types/enums"
import type { RabbitTableData, RabbitFormOptions } from "@/app/rabbits/types"
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function RabbitsClient({
  initialData,
  options,
}: {
  initialData: RabbitTableData[]
  options: RabbitFormOptions
}) {
  const router = useRouter()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRabbit, setEditingRabbit] = React.useState<RabbitTableData | undefined>(undefined)

  const [weightOpen, setWeightOpen] = React.useState(false)
  const [weightRabbit, setWeightRabbit] = React.useState<RabbitTableData | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteRabbitTarget, setDeleteRabbitTarget] = React.useState<RabbitTableData | null>(null)

  const [analyticsOpen, setAnalyticsOpen] = React.useState(false)
  const [analyticsRabbit, setAnalyticsRabbit] = React.useState<RabbitTableData | null>(null)

  // Every quick status change (retire, mark deceased, etc.) routes through
  // this single confirmation dialog rather than mutating on click — see
  // row-actions.tsx, which now only *requests* a status change here.
  const [statusChangeOpen, setStatusChangeOpen] = React.useState(false)
  const [statusChangeRabbit, setStatusChangeRabbit] = React.useState<RabbitTableData | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = React.useState<RabbitStatus | null>(null)

  // Mirrors whatever the table currently has visible after search + facet
  // filters, so the summary tiles above the table always describe "what
  // you're looking at" rather than the whole unfiltered herd.
  const [filteredRows, setFilteredRows] = React.useState<RabbitTableData[]>(initialData)

  function refresh() {
    router.refresh()
  }

  // Status and Health are the filters farmers reach for most often (they
  // drive the "who needs attention today" workflow), so they stay inline.
  // Gender, Breed, and Purpose are narrower/less-frequent cuts and move
  // into the "More filters" popover — keeps the toolbar to a single row
  // on desktop instead of wrapping or overflowing.
  const facets: FacetedFilterConfig[] = React.useMemo(
    () => [
      {
        columnId: "status",
        title: "Status",
        priority: "primary",
        options: Object.values(RabbitStatus).map((s) => ({ label: toTitleCase(s), value: s })),
      },
      {
        columnId: "healthStatus",
        title: "Health",
        priority: "primary",
        options: Object.values(HealthStatus).map((h) => ({ label: toTitleCase(h), value: h })),
      },
      {
        columnId: "gender",
        title: "Gender",
        priority: "primary",
        options: [
          { label: "Doe", value: Gender.FEMALE },
          { label: "Buck", value: Gender.MALE },
        ],
      },
      {
        columnId: "breedName",
        title: "Breed",
        priority: "secondary",
        options: options.breeds.map((b) => ({ label: b.label, value: b.value })),
      },
      {
        columnId: "purpose",
        title: "Purpose",
        priority: "secondary",
        options: Object.values(RabbitPurpose).map((p) => ({ label: toTitleCase(p), value: p })),
      },
    ],
    [options.breeds]
  )

  return (
    <>
      <RabbitsSummaryStats rabbits={filteredRows} />

      <DataTable
        columns={columns}
        data={initialData}
        searchPlaceholder="Search tag, name, color, source farm…"
        searchableRowAsString={(r) =>
          [r.tagNumber, r.name, r.color, r.markings, r.sourceFarm, r.notes, r.breedName, r.cageLabel]
            .filter(Boolean)
            .join(" ")
        }
        facets={facets}
        emptyMessage="No rabbits yet — add your first one to get started."
        onFilteredRowsChange={setFilteredRows}
        toolbarActions={
          <Button
            size="sm"
            className="h-8"
            onClick={() => {
              setEditingRabbit(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-0.5 h-3.5 w-3.5" />
            Add Rabbit
          </Button>
        }
        meta={{
          onViewAnalytics: (rabbit) => {
            setAnalyticsRabbit(rabbit)
            setAnalyticsOpen(true)
          },
          onEdit: (rabbit) => {
            setEditingRabbit(rabbit)
            setFormOpen(true)
          },
          onLogWeight: (rabbit) => {
            setWeightRabbit(rabbit)
            setWeightOpen(true)
          },
          onDelete: (rabbit) => {
            setDeleteRabbitTarget(rabbit)
            setDeleteOpen(true)
          },
          onQuickStatus: (rabbit, status) => {
            setStatusChangeRabbit(rabbit)
            setStatusChangeTarget(status)
            setStatusChangeOpen(true)
          },
        }}
      />

      <RabbitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        options={options}
        rabbit={editingRabbit}
        onSaved={refresh}
      />

      <LogWeightDialog
        open={weightOpen}
        onOpenChange={setWeightOpen}
        rabbit={weightRabbit}
        onSaved={refresh}
      />

      <DeleteRabbitDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        rabbit={deleteRabbitTarget}
        onDeleted={refresh}
      />

      <RabbitAnalyticsDialog open={analyticsOpen} onOpenChange={setAnalyticsOpen} rabbit={analyticsRabbit} />

      <ConfirmStatusChangeDialog
        open={statusChangeOpen}
        onOpenChange={setStatusChangeOpen}
        rabbit={statusChangeRabbit}
        targetStatus={statusChangeTarget}
        onConfirmed={refresh}
      />
    </>
  )
}
