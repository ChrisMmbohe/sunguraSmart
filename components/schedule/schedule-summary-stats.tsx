"use client"

import { AlertTriangle, CalendarClock, Percent, ListTodo } from "lucide-react"
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// NOTE: assuming the shared Tile lives at "@/components/tile" (same one
// used on the Rabbits page / Dashboard). Adjust the path below if it's
// actually nested under "@/components/dashboard/tile" in the project.
import { Tile } from "@/components/shared/tile"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { ScheduleAnalyticsSummary } from "@/app/schedule/types"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// Health color reuses the same red/amber/"good" vocabulary already used
// elsewhere in the app (mortality rate, cage density thresholds) rather
// than inventing a new categorical palette per task type.
// - resolved === 0 -> nothing's completed or missed yet for this type, so
//   there's no signal to color by: neutral slate.
// - otherwise, rate is completed / (completed + missed).
function healthColor(rate: number | null): string {
  if (rate === null) return "#94a3b8" // slate-400 - no resolved history yet
  if (rate >= 0.8) return "var(--chart-2)" // theme's existing "good" chart token
  if (rate >= 0.5) return "#f59e0b" // amber-500
  return "#ef4444" // red-500
}

type ByTypeRow = ScheduleAnalyticsSummary["byType"][number]
type ChartRow = ByTypeRow & { total: number; completionRate: number | null; label: string }

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartRow }[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-popover-foreground">{row.label}</div>
      <div className="space-y-0.5 text-muted-foreground">
        <div>Pending: {row.pending}</div>
        <div>Completed: {row.completed}</div>
        {row.missed > 0 && <div>Missed: {row.missed}</div>}
        {row.cancelled > 0 && <div>Cancelled: {row.cancelled}</div>}
      </div>
    </div>
  )
}

export function ScheduleSummaryStats({ analytics }: { analytics: ScheduleAnalyticsSummary }) {
  const rows: ChartRow[] = analytics.byType
    .map((t) => {
      const total = t.pending + t.completed + t.missed + t.cancelled
      const resolved = t.completed + t.missed
      return {
        ...t,
        total,
        completionRate: resolved > 0 ? t.completed / resolved : null,
        label: toTitleCase(t.type),
      }
    })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total) // biggest workload at the top

  const hasNeutralRow = rows.some((r) => r.completionRate === null)

  return (
    <div className="grid gap-4">
      {/* Reduced to the four numbers that actually drive a farmer's next
          action - mirrors the Litters page's tile profile (shared Tile
          component, one accent color per metric, no filler stats). */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          icon={ListTodo}
          label="Pending tasks"
          value={String(analytics.totalPending)}
          iconClassName="text-blue-600"
          valueClassName="text-blue-600"
          accentClassName="bg-blue-500"
        />
        <Tile
          icon={AlertTriangle}
          label="Overdue"
          value={String(analytics.overdueCount)}
          iconClassName="text-red-600"
          valueClassName="text-red-600"
          accentClassName="bg-red-500"
          caption={analytics.overdueCount === 0 ? "Nothing overdue" : undefined}
        />
        <Tile
          icon={CalendarClock}
          label="Due this week"
          value={String(analytics.dueThisWeekCount)}
          iconClassName="text-amber-600"
          valueClassName="text-amber-600"
          accentClassName="bg-amber-500"
        />
        <Tile
          icon={Percent}
          label="Completion rate"
          value={`${analytics.completionRatePct}%`}
          iconClassName="text-violet-600"
          valueClassName="text-violet-600"
          accentClassName="bg-violet-500"
          caption="trailing 90 days"
        />
      </div>

      {/* Task load by type: a ranked horizontal bar chart. Bar length
          encodes volume (which types generate the most work); bar color
          encodes completion health (red/amber/"good", the same
          vocabulary as the rest of the app) - so one glance answers both
          "where's my workload" and "what's actually falling behind"
          instead of asking the reader to decode four stacked segments
          per row. */}
      {rows.length > 0 && (
        <Card className="shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Task load by type</CardTitle>
            <CardDescription className="text-xs">Bar length is volume, color is completion health</CardDescription>
          </CardHeader>
          <CardContent className="pt-1" style={{ height: Math.max(160, rows.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={16}>
                  {rows.map((row) => (
                    <Cell key={row.type} fill={healthColor(row.completionRate)} />
                  ))}
                  <LabelList dataKey="total" position="right" className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-6 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-2)" }} />
              On track (&ge;80% completed)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Slipping (50-79%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Needs attention (&lt;50%)
            </div>
            {hasNeutralRow && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                No history yet
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
