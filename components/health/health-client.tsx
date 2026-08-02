"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, List, CalendarDays, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/app/health/columns"
import { HealthRecordFormDialog } from "@/components/health/health-record-form-dialog"
import { DeleteHealthRecordDialog } from "@/components/health/delete-health-record-dialog"
import { DiseaseManagerDialog } from "@/components/health/disease-manager-dialog"
import { HealthSummaryStats } from "@/components/health/health-summary-stats"
import { HealthCalendar } from "@/components/health/health-calendar"
import { setHealthRecordOutcome } from "@/app/health/actions"
import { HealthRecordType, HealthRecordOutcome } from "@/types/enums"
import type {
  HealthRecordTableData,
  HealthRecordFormOptions,
  HealthAnalyticsSummary,
  DiseaseTableData,
  FollowUpUrgency,
} from "@/app/health/types"
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar"

const FOLLOW_UP_ORDER: FollowUpUrgency[] = [
  "Overdue",
  "Due today",
  "Due this week",
  "Upcoming",
  "No follow-up",
  "Resolved",
]

const NO_DISEASE = "__no_disease__"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function HealthClient({
  initialData,
  options,
  analytics,
  diseases,
}: {
  initialData: HealthRecordTableData[]
  options: HealthRecordFormOptions
  analytics: HealthAnalyticsSummary
  diseases: DiseaseTableData[]
}) {
  const router = useRouter()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState<HealthRecordTableData | undefined>(undefined)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<HealthRecordTableData | null>(null)

  const [diseaseManagerOpen, setDiseaseManagerOpen] = React.useState(false)

  const [filteredRows, setFilteredRows] = React.useState<HealthRecordTableData[]>(initialData)

  function refresh() {
    router.refresh()
  }

  function openCreate() {
    setEditingRecord(undefined)
    setFormOpen(true)
  }

  function openEdit(item: HealthRecordTableData) {
    setEditingRecord(item)
    setFormOpen(true)
  }

  const diseaseFacetOptions = React.useMemo(() => {
    const names = new Set<string>()
    for (const item of initialData) {
      if (item.diseaseName) names.add(item.diseaseName)
    }
    const opts = Array.from(names)
      .sort()
      .map((label) => ({ label, value: label }))
    opts.push({ label: "None", value: NO_DISEASE })
    return opts
  }, [initialData])

  const rabbitFacetOptions = React.useMemo(() => {
    const labels = new Set<string>()
    for (const item of initialData) labels.add(item.rabbitLabel)
    return Array.from(labels)
      .sort()
      .map((label) => ({ label, value: label }))
  }, [initialData])

  const facets: FacetedFilterConfig[] = React.useMemo(
    () => [
      {
        columnId: "followUpUrgency",
        title: "Follow-up",
        options: FOLLOW_UP_ORDER.map((u) => ({ label: u, value: u })),
      },
      {
        columnId: "outcome",
        title: "Outcome",
        options: Object.values(HealthRecordOutcome).map((o) => ({ label: toTitleCase(o), value: o })),
      },
      {
        columnId: "type",
        title: "Type",
        options: Object.values(HealthRecordType).map((t) => ({ label: toTitleCase(t), value: t })),
      },
      {
        columnId: "diseaseName",
        title: "Disease",
        options: diseaseFacetOptions,
      },
      {
        columnId: "rabbitLabel",
        title: "Rabbit",
        options: rabbitFacetOptions,
      },
    ],
    [diseaseFacetOptions, rabbitFacetOptions]
  )

  return (
    <>
      <HealthSummaryStats analytics={analytics} />

      <Tabs defaultValue="list" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="rounded-xl bg-muted/50 hover:shadow-lg transition-shadow duration-300 border-1 border-border shadow-2xl dark:shadow-muted">
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Follow-up calendar
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setDiseaseManagerOpen(true)}>
              <BookOpen className="mr-2 h-3.5 w-3.5" />
              Disease catalog
            </Button>
            <Button size="sm" className="h-8" onClick={openCreate}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Log health record
            </Button>
          </div>
        </div>

        <TabsContent value="list">
          <DataTable
            columns={columns}
            data={initialData}
            searchPlaceholder="Search rabbit, disease, treatment, notes…"
            searchableRowAsString={(r) =>
              [r.rabbitLabel, r.diseaseName, r.treatment, r.medication, r.dosage, r.notes, r.type, r.outcome]
                .filter(Boolean)
                .join(" ")
            }
            facets={facets}
            emptyMessage="No health records yet — log your first one to get started."
            onFilteredRowsChange={setFilteredRows}
            meta={{
              onEdit: openEdit,
              onSetOutcome: (item, outcome) => {
                void setHealthRecordOutcome(item.id, outcome).then((result) => {
                  if (result.success) refresh()
                })
              },
              onDelete: (item) => {
                setDeleteTarget(item)
                setDeleteOpen(true)
              },
            }}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <HealthCalendar items={filteredRows} onEventClick={openEdit} />
        </TabsContent>
      </Tabs>

      <HealthRecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        options={options}
        record={editingRecord}
        onSaved={refresh}
        onManageDiseases={() => setDiseaseManagerOpen(true)}
      />

      <DeleteHealthRecordDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        record={deleteTarget}
        onDeleted={refresh}
      />

      <DiseaseManagerDialog
        open={diseaseManagerOpen}
        onOpenChange={setDiseaseManagerOpen}
        diseases={diseases}
        onChanged={refresh}
      />
    </>
  )
}
