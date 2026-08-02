"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, List, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/app/schedule/columns"
import { ScheduleFormDialog } from "@/components/schedule/schedule-form-dialog"
import { DeleteScheduleDialog } from "@/components/schedule/delete-schedule-dialog"
import { ScheduleSummaryStats } from "@/components/schedule/schedule-summary-stats"
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar"
import {
  markScheduleCompleted,
  markScheduleMissed,
  cancelSchedule,
  reopenSchedule,
} from "@/app/schedule/actions"
import { ScheduleType, ScheduleStatus, RecurrenceFrequency } from "@/types/enums"
import type {
  ScheduleTableData,
  ScheduleFormOptions,
  ScheduleAnalyticsSummary,
  ScheduleUrgency,
} from "@/app/schedule/types"
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar"

const URGENCY_ORDER: ScheduleUrgency[] = [
  "Overdue",
  "Due today",
  "Due this week",
  "Upcoming",
  "Completed",
  "Missed",
  "Cancelled",
]

const FARM_WIDE = "__farm_wide__"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ScheduleClient({
  initialData,
  options,
  analytics,
}: {
  initialData: ScheduleTableData[]
  options: ScheduleFormOptions
  analytics: ScheduleAnalyticsSummary
}) {
  const router = useRouter()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingSchedule, setEditingSchedule] = React.useState<ScheduleTableData | undefined>(undefined)
  const [defaultDate, setDefaultDate] = React.useState<Date | undefined>(undefined)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ScheduleTableData | null>(null)

  const [filteredRows, setFilteredRows] = React.useState<ScheduleTableData[]>(initialData)

  function refresh() {
    router.refresh()
  }

  function openCreate(date?: Date) {
    setEditingSchedule(undefined)
    setDefaultDate(date)
    setFormOpen(true)
  }

  function openEdit(item: ScheduleTableData) {
    setEditingSchedule(item)
    setDefaultDate(undefined)
    setFormOpen(true)
  }

  const rabbitFacetOptions = React.useMemo(() => {
    const labels = new Set<string>()
    for (const item of initialData) {
      if (item.rabbitLabel) labels.add(item.rabbitLabel)
    }
    const opts = Array.from(labels)
      .sort()
      .map((label) => ({ label, value: label }))
    opts.push({ label: "Farm-wide", value: FARM_WIDE })
    return opts
  }, [initialData])

  const facets: FacetedFilterConfig[] = React.useMemo(
    () => [
      {
        columnId: "urgency",
        title: "Urgency",
        options: URGENCY_ORDER.map((u) => ({ label: u, value: u })),
      },
      {
        columnId: "status",
        title: "Status",
        options: Object.values(ScheduleStatus).map((s) => ({ label: toTitleCase(s), value: s })),
      },
      {
        columnId: "type",
        title: "Type",
        options: Object.values(ScheduleType).map((t) => ({ label: toTitleCase(t), value: t })),
      },
      {
        columnId: "rabbitLabel",
        title: "Rabbit",
        options: rabbitFacetOptions,
      },
      {
        columnId: "recurrenceLabel",
        title: "Repeats",
        options: Object.values(RecurrenceFrequency).map((f) => ({
          label: f === RecurrenceFrequency.NONE ? "One-time" : toTitleCase(f),
          value: f,
        })),
      },
    ],
    [rabbitFacetOptions]
  )

  return (
    <>
      <ScheduleSummaryStats analytics={analytics} />

      <Tabs defaultValue="list" className="gap-4">
        <div className="flex items-center justify-between ">
          <TabsList className="rounded-xl bg-muted/50 hover:shadow-lg transition-shadow duration-300 border-1 border-border shadow-2xl dark:shadow-muted">
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <Button size="sm" className="h-8" onClick={() => openCreate()}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add schedule item
          </Button>
        </div>

        <TabsContent value="list">
          <DataTable
            columns={columns}
            data={initialData}
            searchPlaceholder="Search title, notes, rabbit…"
            searchableRowAsString={(r) =>
              [r.title, r.notes, r.rabbitLabel, r.type, r.status, r.recurrenceLabel].filter(Boolean).join(" ")
            }
            facets={facets}
            emptyMessage="No schedule items yet — add your first task to get started."
            onFilteredRowsChange={setFilteredRows}
            meta={{
              onEdit: openEdit,
              onComplete: (item) => {
                void markScheduleCompleted(item.id).then((result) => {
                  if (result.success) refresh()
                })
              },
              onMissed: (item) => {
                void markScheduleMissed(item.id).then((result) => {
                  if (result.success) refresh()
                })
              },
              onCancel: (item) => {
                void cancelSchedule(item.id).then((result) => {
                  if (result.success) refresh()
                })
              },
              onReopen: (item) => {
                void reopenSchedule(item.id).then((result) => {
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
          <ScheduleCalendar items={filteredRows} onDayClick={openCreate} onEventClick={openEdit} />
        </TabsContent>
      </Tabs>

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        options={options}
        schedule={editingSchedule}
        defaultDate={defaultDate}
        onSaved={refresh}
      />

      <DeleteScheduleDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        schedule={deleteTarget}
        onDeleted={refresh}
      />
    </>
  )
}
