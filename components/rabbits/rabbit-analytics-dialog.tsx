"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus, Scale, CalendarDays, Baby, HeartPulse } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { WeightHistoryChart } from "@/components/rabbits/weight-history-chart"
import { getRabbitAnalytics } from "@/app/rabbits/actions"
import { Gender } from "@/types/enums"
import type { RabbitTableData, RabbitAnalytics } from "@/app/rabbits/types"

function formatAge(days?: number): string {
  if (days === undefined) return "Unknown"
  if (days < 30) return `${days} days`
  if (days < 365) return `${Math.floor(days / 30)} months`
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return months > 0 ? `${years}y ${months}mo` : `${years} years`
}

function MetricTile({
  icon: Icon,
  label,
  value,
  caption,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  caption?: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
      {caption && <div className="text-xs text-muted-foreground">{caption}</div>}
    </div>
  )
}

export function RabbitAnalyticsDialog({
  open,
  onOpenChange,
  rabbit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rabbit: RabbitTableData | null
}) {
  const [analytics, setAnalytics] = React.useState<RabbitAnalytics | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !rabbit) return

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setAnalytics(null)

    getRabbitAnalytics(rabbit.id).then((result) => {
      if (cancelled) return
      if (result.success && result.data) {
        setAnalytics(result.data)
      } else {
        setError(result.error ?? "Couldn't load analytics for this rabbit.")
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, rabbit])

  const isDoe = rabbit?.gender === Gender.FEMALE

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rabbit?.name || rabbit?.tagNumber}</DialogTitle>
          <DialogDescription>
            {rabbit?.breedName} · #{rabbit?.tagNumber} · {isDoe ? "Doe" : "Buck"}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading analytics…</p>}

        {error && !isLoading && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {analytics && !isLoading && (
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">Weight history</h4>
                {analytics.weightTrend && (
                  <Badge
                    variant="secondary"
                    className={
                      analytics.weightTrend.deltaKg > 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : analytics.weightTrend.deltaKg < 0
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    }
                  >
                    {analytics.weightTrend.deltaKg > 0 ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : analytics.weightTrend.deltaKg < 0 ? (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    ) : (
                      <Minus className="mr-1 h-3 w-3" />
                    )}
                    {analytics.weightTrend.deltaKg > 0 ? "+" : ""}
                    {analytics.weightTrend.deltaKg.toFixed(2)} kg since last reading
                  </Badge>
                )}
              </div>
              <WeightHistoryChart data={analytics.weightHistory} />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <MetricTile
                icon={Scale}
                label="Current weight"
                value={analytics.latestWeightKg !== undefined ? `${analytics.latestWeightKg.toFixed(2)} kg` : "—"}
              />
              <MetricTile
                icon={CalendarDays}
                label="Age / on farm"
                value={formatAge(analytics.ageDays)}
                caption={`${analytics.daysOnFarm}d on this farm`}
              />
              <MetricTile
                icon={Baby}
                label={isDoe ? "Litters produced" : "Litters sired"}
                value={String(analytics.litterCount)}
                caption={
                  analytics.avgLitterSize !== null
                    ? `${analytics.avgLitterSize} kits avg`
                    : analytics.totalOffspring > 0
                    ? `${analytics.totalOffspring} total kits`
                    : undefined
                }
              />
              <MetricTile
                icon={HeartPulse}
                label="Health records"
                value={String(analytics.healthRecordCount)}
                caption={
                  analytics.lastHealthEvent
                    ? `Last: ${analytics.lastHealthEvent.type.replace(/_/g, " ")}`
                    : "No records yet"
                }
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
