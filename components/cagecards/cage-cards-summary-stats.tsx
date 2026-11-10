"use client"

import { Home, DoorOpen, Boxes, PercentCircle } from "lucide-react"
import type { CageSummary } from "@/app/cagecards/types"
import { Tile } from "@/components/shared/tile"

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
