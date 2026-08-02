"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FinanceTransactionData } from "@/app/finances/types"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function buildMonthGrid(monthAnchor: Date): Date[] {
  const first = startOfMonth(monthAnchor)
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - first.getDay())

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push(d)
  }
  return days
}

export function FinancesCalendar({
  items,
  onEventClick,
  onAddSale,
  onAddExpense,
}: {
  items: FinanceTransactionData[]
  onEventClick: (item: FinanceTransactionData) => void
  onAddSale: (date: Date) => void
  onAddExpense: (date: Date) => void
}) {
  const [monthAnchor, setMonthAnchor] = React.useState(() => startOfMonth(new Date()))
  const today = new Date()
  const { format } = useCurrency()

  const days = React.useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor])

  const itemsByDay = React.useMemo(() => {
    const map = new Map<string, FinanceTransactionData[]>()
    for (const item of items) {
      const d = new Date(item.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  function keyFor(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <div className="text-sm font-semibold">
          {monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonthAnchor(startOfMonth(new Date()))}
            className="h-7 px-2 text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthAnchor.getMonth()
          const dayItems = itemsByDay.get(keyFor(day)) ?? []
          const revenue = dayItems.filter((i) => i.kind === "sale").reduce((s, i) => s + i.amount, 0)
          const expenses = dayItems.filter((i) => i.kind === "expense").reduce((s, i) => s + i.amount, 0)
          const net = revenue - expenses

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "group relative flex min-h-24 flex-col gap-1 border-b border-r p-1.5 last:border-r-0",
                !inMonth && "bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    isSameDay(day, today) && "bg-primary font-semibold text-primary-foreground",
                    !inMonth && "text-muted-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hidden h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted group-hover:flex"
                      aria-label="Add transaction"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onAddSale(day)}>
                      <ArrowUpCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                      Log a sale
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddExpense(day)}>
                      <ArrowDownCircle className="mr-2 h-3.5 w-3.5 text-red-600" />
                      Log an expense
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {dayItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => onEventClick(dayItems[0])}
                  className={cn(
                    "rounded px-1 py-0.5 text-left text-[11px] font-medium hover:opacity-80",
                    net >= 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                  )}
                  title={`${dayItems.length} transaction${dayItems.length === 1 ? "" : "s"}`}
                >
                  {net >= 0 ? "+" : "−"}
                  {format(Math.abs(net), { compact: true })}
                </button>
              )}
              {dayItems.length > 1 && (
                <span className="text-[10px] text-muted-foreground">{dayItems.length} transactions</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
