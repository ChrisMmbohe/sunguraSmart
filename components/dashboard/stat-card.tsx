import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Tile } from "@/components/shared/tile"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  iconClassName?: string
  valueClassName?: string
  /** Left accent bar color, e.g. "bg-emerald-500". Matches the dashboard's
   *  per-metric color at one shade lighter, same convention as the cage
   *  occupancy card's density accent. */
  accentClassName?: string
  caption?: ReactNode
}

/**
 * Thin wrapper around the shared Tile so every dashboard KPI renders through
 * the exact same shell as the Rabbits page summary tiles — border, shadow,
 * neutral icon roundel, single-line label+caption — with a colored accent
 * bar carrying the per-metric color.
 */
export function StatCard({
  label,
  value,
  icon,
  iconClassName,
  valueClassName,
  accentClassName,
  caption,
}: StatCardProps) {
  return (
    <Tile
      icon={icon}
      label={label}
      value={value}
      caption={caption}
      iconClassName={iconClassName}
      valueClassName={valueClassName}
      accentClassName={accentClassName}
    />
  )
}
