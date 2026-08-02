import { Home } from "lucide-react"
import { Tile } from "@/components/shared/tile"

export interface CageOccupancyCardProps {
  totalCages: number
  occupiedCages: number
  totalCapacity: number
  occupiedSlots: number
  occupancyPct: number
  availableSlots: number
}

// Occupancy is a "how tight is capacity right now" signal, so the accent
// bar, icon, and value shift color as it climbs toward full — comfortable
// at low/mid occupancy, a heads-up once cages are nearly maxed out.
// Thresholds are deliberately generous (a rabbitry running at 70% isn't in
// trouble) so the amber/red states stay meaningful rather than firing
// constantly.
function densityStyles(pct: number) {
  if (pct >= 90) {
    return { accent: "bg-red-500", icon: "text-red-600", value: "text-red-600" }
  }
  if (pct >= 70) {
    return { accent: "bg-amber-500", icon: "text-amber-600", value: "text-amber-600" }
  }
  return { accent: "bg-sky-500", icon: "text-sky-600", value: "text-sky-600" }
}

export function CageOccupancyCard({
  totalCages,
  occupiedCages,
  totalCapacity,
  occupiedSlots,
  occupancyPct,
}: CageOccupancyCardProps) {
  const s = densityStyles(occupancyPct)

  return (
    <Tile
      icon={Home}
      label="Cage occupancy"
      value={`${occupancyPct.toFixed(0)}%`}
      caption={`${occupiedCages}/${totalCages} cages · ${occupiedSlots}/${totalCapacity} slots`}
      iconClassName={s.icon}
      valueClassName={s.value}
      accentClassName={s.accent}
    />
  )
}
