"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { HealthRecordTableData, FollowUpUrgency } from "@/app/health/types"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const dotStyles: Record<FollowUpUrgency, string> = {
  Overdue: "bg-red-500",
  "Due today": "bg-orange-500",
  "Due this week": "bg-amber-500",
  Upcoming: "bg-blue-500",
  "No follow-up": "bg-neutral-300",
  Resolved: "bg-emerald-500",
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function buildMonthGrid(monthAnchor: Date): Date[] {
  const first = startOfMonth(monthAnchor)
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - first.getDay())

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }
  return days
}

/**
 * Shows follow-up dates rather than record dates — the actionable, still
 * plannable side of a health record (analogous to Schedule's dueDate).
 * Historical record entries are better served by the searchable table.
 */
export function HealthCalendar({
  items,
  onEventClick,
}: {
  items: HealthRecordTableData[]
  onEventClick: (item: HealthRecordTableData) => void
}) {
  const [monthAnchor, setMonthAnchor] = React.useState(() => startOfMonth(new Date()))
  const today = new Date()

  const days = React.useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])

  const itemsByDay = React.useMemo(() => {
    const map = new Map<string, HealthRecordTableData[]>()
    for (const item of items) {
      if (!item.followUpDate) continue
      const d = new Date(item.followUpDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  function keyFor(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">
            {monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>
          <span className="text-xs text-muted-foreground">— follow-up dates</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthAnchor(startOfMonth(new Date()))}
            className="h-7 px-2 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthAnchor.getMonth()
          const dayItems = itemsByDay.get(keyFor(day)) ?? []
          const visible = dayItems.slice(0, 3)
          const overflow = dayItems.length - visible.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r p-1.5 last:border-r-0",
                !inMonth && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  isSameDay(day, today) && "bg-primary font-semibold text-primary-foreground",
                  !inMonth && "text-muted-foreground"
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-0.5">
                {visible.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onEventClick(item)}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] hover:bg-muted"
                    title={`${item.rabbitLabel} — ${item.diseaseName ?? item.type}`}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotStyles[item.followUpUrgency])} />
                    <span className="truncate">{item.rabbitLabel}</span>
                    {item.diseaseContagious && <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-red-500" />}
                  </button>
                ))}
                {overflow > 0 && (
                  <Badge variant="secondary" className="w-fit px-1 py-0 text-[10px]">
                    +{overflow} more
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
