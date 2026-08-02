"use client"

import { MoreHorizontal, MapPin, Pencil, Trash2, Users, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CageStatus } from "@/types/enums"
import type { CageCardData } from "@/app/cage-cards/types"

const statusStyles: Partial<Record<CageStatus, string>> = {
  [CageStatus.OCCUPIED]: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  [CageStatus.EMPTY]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
}
// Covers any status values beyond occupied/empty (e.g. maintenance) that
// this file doesn't have an enum-complete list for.
const fallbackStatusStyle = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"

function occupancyBadgeStyle(count: number, capacity: number) {
  if (count === 0) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
  if (count >= capacity) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
  return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
}

export function CageCard({
  cage,
  onEdit,
  onDelete,
  onManageOccupants,
  onPrint,
}: {
  cage: CageCardData
  onEdit: () => void
  onDelete: () => void
  onManageOccupants: () => void
  onPrint: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold leading-tight">{cage.label}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs capitalize text-muted-foreground">
            {cage.type.replace(/_/g, " ")}
            {cage.location && (
              <>
                <span>·</span>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate normal-case">{cage.location}</span>
              </>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem onClick={onManageOccupants}>
              <Users className="mr-2 h-3.5 w-3.5" />
              Manage occupants
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="mr-2 h-3.5 w-3.5" />
              Print card
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit cage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={statusStyles[cage.status] ?? fallbackStatusStyle}>
          {cage.status}
        </Badge>
        <Badge variant="secondary" className={occupancyBadgeStyle(cage.occupantCount, cage.capacity)}>
          {cage.occupantCount}/{cage.capacity} occupied
        </Badge>
      </div>

      {/* Count only, per spec — click through for the actual occupant list. */}
      <button
        type="button"
        onClick={onManageOccupants}
        className="rounded-md border border-dashed px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        {cage.occupantCount === 0
          ? "Empty — click to assign a rabbit"
          : `${cage.occupantCount} rabbit${cage.occupantCount === 1 ? "" : "s"} inside · click for detail`}
      </button>

      {cage.notes && <p className="truncate text-xs text-muted-foreground">{cage.notes}</p>}
    </div>
  )
}
