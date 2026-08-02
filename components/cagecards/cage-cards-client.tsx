"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CageStatus, CageType } from "@/types/enums"
import { CageCard } from "@/components/cagecards/cage-card"
import { CageCardsSummaryStats } from "@/components/cagecards/cage-cards-summary-stats"
import { CageFormDialog } from "@/components/cagecards/cage-form-dialog"
import { DeleteCageDialog } from "@/components/cagecards/delete-cage-dialog"
import { CageOccupantsDialog } from "@/components/cagecards/cage-occupants-dialog"
import { CagePrintDialog } from "@/components/cagecards/cage-print-dialog"
import type { CageCardData, CageSummary } from "@/app/cagecards/types"

const ALL = "__all__"

export function CageCardsClient({ cages, summary }: { cages: CageCardData[]; summary: CageSummary }) {
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState(ALL)
  const [typeFilter, setTypeFilter] = React.useState(ALL)

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCage, setEditingCage] = React.useState<CageCardData | undefined>(undefined)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<CageCardData | null>(null)

  const [occupantsOpen, setOccupantsOpen] = React.useState(false)
  const [occupantsCage, setOccupantsCage] = React.useState<CageCardData | null>(null)

  const [printOpen, setPrintOpen] = React.useState(false)
  const [printCage, setPrintCage] = React.useState<CageCardData | null>(null)

  function refresh() {
    router.refresh()
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return cages.filter((c) => {
      if (statusFilter !== ALL && c.status !== statusFilter) return false
      if (typeFilter !== ALL && c.type !== typeFilter) return false
      if (q) {
        const haystack = [c.label, c.location, c.notes].filter(Boolean).join(" ").toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [cages, search, statusFilter, typeFilter])

  return (
    <>
      <CageCardsSummaryStats summary={summary} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search label, location, notes…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(CageStatus).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {Object.values(CageType).map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="ml-auto h-8"
          onClick={() => {
            setEditingCage(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add cage
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {cages.length === 0
            ? "No cages yet — add your first one to get started."
            : "No cages match your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((cage) => (
            <CageCard
              key={cage.id}
              cage={cage}
              onEdit={() => {
                setEditingCage(cage)
                setFormOpen(true)
              }}
              onDelete={() => {
                setDeleteTarget(cage)
                setDeleteOpen(true)
              }}
              onManageOccupants={() => {
                setOccupantsCage(cage)
                setOccupantsOpen(true)
              }}
              onPrint={() => {
                setPrintCage(cage)
                setPrintOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <CageFormDialog open={formOpen} onOpenChange={setFormOpen} cage={editingCage} onSaved={refresh} />
      <DeleteCageDialog open={deleteOpen} onOpenChange={setDeleteOpen} cage={deleteTarget} onDeleted={refresh} />
      <CageOccupantsDialog
        open={occupantsOpen}
        onOpenChange={setOccupantsOpen}
        cage={occupantsCage}
        onChanged={refresh}
      />
      <CagePrintDialog open={printOpen} onOpenChange={setPrintOpen} cage={printCage} />
    </>
  )
}
