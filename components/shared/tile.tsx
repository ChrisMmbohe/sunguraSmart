import type { ReactNode, ComponentType } from "react"
import { cn } from "@/lib/utils"

interface TileProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  /** Supports plain strings as well as multi-segment/colored ReactNode
   *  content (e.g. a colored count + a separate colored count). Renders on
   *  its own line beneath the label and wraps rather than truncating. */
  caption?: ReactNode
  iconClassName?: string
  valueClassName?: string
  /** Left accent bar color, e.g. "bg-emerald-500". Omit for no accent. */
  accentClassName?: string
}

/**
 * Shared KPI tile — the single visual definition for every summary card in
 * the app (Rabbits page, Dashboard). Rounded border, soft shadow that lifts
 * on hover, a neutral icon roundel. Label sits above an optional caption
 * line that can carry its own colored segments and wrap onto multiple
 * lines when needed. An optional colored bar on the left edge carries a
 * "temperature" signal for the metric (e.g. cage density, health urgency)
 * without tinting the icon roundel itself.
 */
export function Tile({
  icon: Icon,
  label,
  value,
  caption,
  iconClassName,
  valueClassName,
  accentClassName,
}: TileProps) {
  return (
    <div className="relative flex items-start gap-3 overflow-hidden rounded-lg border bg-card px-4 py-3 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1">
      {accentClassName ? (
        <span className={cn("absolute inset-y-0 left-0 w-1", accentClassName)} aria-hidden />
      ) : null}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className={cn("h-5 w-5", iconClassName ?? "text-muted-foreground")} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-lg font-semibold leading-tight tabular-nums", valueClassName)}>{value}</div>
        <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
          <span className="font-medium text-foreground/70">{label}</span>
          {caption ? <span className="mt-0.5 block text-muted-foreground/80">{caption}</span> : null}
        </div>
      </div>
    </div>
  )
}
