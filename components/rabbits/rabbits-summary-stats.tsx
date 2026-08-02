"use client"

import * as React from "react"
import { Rabbit as RabbitIcon, Scale, AlertTriangle, Home } from "lucide-react"
import { RabbitStatus, HealthStatus } from "@/types/enums"
import type { RabbitTableData } from "@/app/rabbits/types"
import { Tile } from "@/components/shared/tile"

/**
 * Computed entirely from whatever rows are currently visible in the table
 * (post search + facet filters), so this reflects "the does under 6 months"
 * just as accurately as "the whole herd" — no separate query needed.
 *
 * Reduced to the four metrics that matter most to a space- and
 * health-constrained urban rabbitry: what's here right now, who needs
 * attention (disease spreads fast at high density), where cage space is
 * being wasted or missing, and average market weight. Breed ratio and
 * average age are useful but non-urgent demographic info, so they were
 * dropped in favor of keeping this row scannable at a glance.
 *
 * Each tile carries a colored accent bar matching its icon/value color —
 * the same convention used on the Dashboard's KPI tiles and its Cage
 * Occupancy card.
 *
 * No horizontal/vertical padding here — the parent page container already
 * supplies `p-4 pt-0`, so this component owns only the grid/gap layout.
 */
export function RabbitsSummaryStats({ rabbits }: { rabbits: RabbitTableData[] }) {
  const stats = React.useMemo(() => {
    const total = rabbits.length
    const active = rabbits.filter((r) => r.status === RabbitStatus.ACTIVE).length

    const weighed = rabbits.filter((r) => r.currentWeightKg !== undefined)
    const avgWeight = weighed.length
      ? weighed.reduce((sum, r) => sum + (r.currentWeightKg ?? 0), 0) / weighed.length
      : null

    const needsAttention = rabbits.filter((r) =>
      [HealthStatus.SICK, HealthStatus.RECOVERING, HealthStatus.QUARANTINED].includes(r.healthStatus)
    ).length

    const unassigned = rabbits.filter((r) => !r.cageId && r.status === RabbitStatus.ACTIVE).length

    return { total, active, avgWeight, needsAttention, unassigned }
  }, [rabbits])

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        icon={RabbitIcon}
        label="Shown"
        value={String(stats.total)}
        iconClassName="text-slate-600"
        valueClassName="text-slate-600"
        accentClassName="bg-slate-500"
        caption={`${stats.active} active`}
      />
      <Tile
        icon={AlertTriangle}
        label="Needs attention"
        value={String(stats.needsAttention)}
        caption="sick/recovering/quarantined"
        iconClassName="text-red-600"
        valueClassName="text-red-600"
        accentClassName="bg-red-500"
      />
      <Tile
        icon={Home}
        label="Unassigned"
        value={String(stats.unassigned)}
        caption="active, no cage"
        iconClassName="text-orange-600"
        valueClassName="text-orange-600"
        accentClassName="bg-orange-500"
      />
      <Tile
        icon={Scale}
        label="Avg weight"
        value={stats.avgWeight !== null ? `${stats.avgWeight.toFixed(2)} kg` : "—"}
        iconClassName="text-amber-600"
        valueClassName="text-amber-600"
        accentClassName="bg-amber-500"
      />
    </section>
  )
}
