import { Baby, CalendarClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface DueBreedingItem {
  id: string
  doeName: string
  buckName: string
  expectedDueDate: Date
  isOverdue: boolean
}

export interface UpcomingScheduleItem {
  id: string
  title: string
  type: string
  dueDate: Date
  rabbitName?: string
  isOverdue: boolean
}

function formatDueLabel(date: Date, isOverdue: boolean) {
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000)
  if (isOverdue) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  return `In ${days}d`
}

export function AttentionPanel({
  dueBreedings,
  upcomingSchedule,
}: {
  dueBreedings: DueBreedingItem[]
  upcomingSchedule: UpcomingScheduleItem[]
}) {
  const isEmpty = dueBreedings.length === 0 && upcomingSchedule.length === 0

  return (
    <Card className="p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1">
      <CardHeader>
        <CardTitle className="text-base">Needs attention</CardTitle>
        <CardDescription>Kindles due soon and upcoming health &amp; feeding tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {isEmpty && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing due in the next few days. Farm&apos;s on schedule.
          </p>
        )}

        {dueBreedings.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
                <Baby className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">
                  {b.doeName} × {b.buckName}
                </p>
                <p className="text-xs text-muted-foreground">Expected kindle</p>
              </div>
            </div>
            <Badge variant={b.isOverdue ? "destructive" : "secondary"} className="shrink-0">
              {formatDueLabel(b.expectedDueDate, b.isOverdue)}
            </Badge>
          </div>
        ))}

        {upcomingSchedule.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                <CalendarClock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.rabbitName ? `${s.rabbitName} · ` : ""}
                  {s.type ? s.type.replace(/_/g, " ") : ""}
                </p>
              </div>
            </div>
            <Badge variant={s.isOverdue ? "destructive" : "secondary"} className="shrink-0">
              {formatDueLabel(s.dueDate, s.isOverdue)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
