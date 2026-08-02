"use client"

import * as React from "react"
import { Home, DoorOpen, Boxes, PercentCircle } from "lucide-react"
import type { CageSummary } from "@/app/cagecards/types"

function Tile({
  icon: Icon,
  label,
  value,
  caption,
  iconClassName,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  caption?: string
  iconClassName?: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className={`h-5 w-5 ${iconClassName ?? "text-muted-foreground"}`} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-tight tabular-nums">{value}</div>
        <div className="truncate text-xs text-muted-foreground">
          {label}
          {caption ? ` · ${caption}` : ""}
        </div>
      </div>
    </div>
  )
}

export function CageCardsSummaryStats({ summary }: { summary: CageSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        icon={Home}
        label="Total cages"
        value={String(summary.totalCages)}
        caption={`${summary.occupiedCages} occupied`}
        iconClassName="text-amber-600"
        valueClassName="text-amber-600"
      />
      <Tile icon={DoorOpen} label="Empty cages" value={String(summary.emptyCages)} />
      <Tile
        icon={Boxes}
        label="Capacity"
        value={String(summary.totalCapacity)}
        caption={`${summary.availableSlots} free`}
      />
      <Tile
        icon={PercentCircle}
        label="Occupancy"
        value={`${summary.occupancyPct.toFixed(0)}%`}
        caption={`${summary.occupiedSlots}/${summary.totalCapacity} slots`}
      />
    </div>
  )
}
