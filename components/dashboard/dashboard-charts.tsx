"use client"

import { useState } from "react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"

// ---------------------------------------------------------------------------
// Shared tokens
// ---------------------------------------------------------------------------

// Semantic finance colors — deliberately distinct from the red/destructive
// used for health alerts elsewhere on the dashboard, so "expense" never
// reads as "danger."
const REVENUE_COLOR = "#059669" // emerald-600
const EXPENSE_COLOR = "#f97316" // orange-500
const NET_COLOR = "#6366f1" // indigo-500

// Breed palette. NOTE: this app's globals.css does not define --chart-1..5
// (those tokens are only wired up if the shadcn "charts" block was
// installed), so hsl(var(--chart-N)) silently resolves to the same
// invalid/empty value for every slice — which is why every breed rendered
// identically. Using explicit, hand-picked hex values sidesteps that and
// guarantees each breed is visually distinct regardless of what's in
// globals.css. These are chosen to sit comfortably alongside the app's
// existing accent colors (emerald/pink/purple/amber/red) without colliding
// with their semantic meaning (revenue, alerts, breeding, feed).
const BREED_HUES = [
  "#0ea5e9", // sky-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#14b8a6", // teal-500
  "#d946ef", // fuchsia-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
]

function breedColor(i: number) {
  const hue = BREED_HUES[i % BREED_HUES.length]
  const cycle = Math.floor(i / BREED_HUES.length)
  if (cycle === 0) return hue
  // Extra passes through the palette (9th+ breed) get progressively
  // lighter so they stay distinguishable instead of repeating a color.
  const mixAmount = Math.min(55, cycle * 25)
  return `color-mix(in srgb, ${hue} ${100 - mixAmount}%, white ${mixAmount}%)`
}

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  notation: "compact",
  maximumFractionDigits: 1,
})

// Axis ticks need to stay narrow, so they drop the "KES" prefix (the chart
// is unambiguously financial given the legend/tooltip) and just show the
// compact number, e.g. "120K" instead of "KES 120K".
const compactNumberFormatter = new Intl.NumberFormat("en-KE", {
  notation: "compact",
  maximumFractionDigits: 1,
})

function tooltipShellStyle(): React.CSSProperties {
  return {
    backgroundColor: "hsl(var(--popover, 0 0% 100%))",
    color: "hsl(var(--popover-foreground, 222 47% 11%))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.25)",
    fontSize: 12,
    lineHeight: 1.5,
    padding: "10px 12px",
    minWidth: 150,
  }
}

// ---------------------------------------------------------------------------
// Revenue vs. expenses
// ---------------------------------------------------------------------------

export interface MonthlyFinancePoint {
  month: string // e.g. "Feb"
  revenue: number
  expenses: number
}

function FinanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | string; dataKey?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const revenue = Number(payload.find((p) => p.dataKey === "revenue")?.value ?? 0)
  const expenses = Number(payload.find((p) => p.dataKey === "expenses")?.value ?? 0)
  const net = revenue - expenses

  return (
    <div style={tooltipShellStyle()}>
      <div className="mb-1.5 font-semibold">{label}</div>
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 font-medium opacity-80">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: REVENUE_COLOR }} />
          Revenue
        </span>
        <span className="tabular-nums font-semibold">{currencyFormatter.format(revenue)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 font-medium opacity-80">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} />
          Expenses
        </span>
        <span className="tabular-nums font-semibold">{currencyFormatter.format(expenses)}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-6 border-t border-border pt-1.5">
        <span className="flex items-center gap-1.5 font-medium opacity-80">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NET_COLOR }} />
          Net
        </span>
        <span
          className="tabular-nums font-semibold"
          style={{ color: net >= 0 ? REVENUE_COLOR : EXPENSE_COLOR }}
        >
          {net >= 0 ? "+" : "−"}
          {currencyFormatter.format(Math.abs(net))}
        </span>
      </div>
    </div>
  )
}

export function RevenueExpenseChart({ data }: { data: MonthlyFinancePoint[] }) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0)
  const netProfit = totalRevenue - totalExpenses

  const chartData = data.map((d) => ({ ...d, net: d.revenue - d.expenses }))

  return (
    <div className="space-y-3">
      {/* Legend/summary strip — replaces the default recharts legend with
          figures that actually matter at a glance. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: REVENUE_COLOR }} />
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-medium tabular-nums">{compactCurrencyFormatter.format(totalRevenue)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: EXPENSE_COLOR }} />
          <span className="text-muted-foreground">Expenses</span>
          <span className="font-medium tabular-nums">{compactCurrencyFormatter.format(totalExpenses)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-current" style={{ color: NET_COLOR }} />
          <span className="text-muted-foreground">Net</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: netProfit >= 0 ? REVENUE_COLOR : EXPENSE_COLOR }}
          >
            {netProfit >= 0 ? "+" : "−"}
            {compactCurrencyFormatter.format(Math.abs(netProfit))}
          </span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData} barGap={4} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={REVENUE_COLOR} stopOpacity={0.95} />
              <stop offset="100%" stopColor={REVENUE_COLOR} stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.95} />
              <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tickMargin={8}
            tickFormatter={(v: number) => compactNumberFormatter.format(v)}
            className="text-xs fill-muted-foreground"
          />
          <Tooltip cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} content={<FinanceTooltip />} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="url(#revenueGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="url(#expenseGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
          <Line
            dataKey="net"
            name="Net"
            type="monotone"
            stroke={NET_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: NET_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Population by breed
// ---------------------------------------------------------------------------

export interface BreedPopulationSlice {
  name: string
  count: number
}

function BreedTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; payload?: { fill?: string } }[]
  total: number
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const value = Number(entry.value ?? 0)
  const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0"

  return (
    <div style={tooltipShellStyle()}>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.payload?.fill }} />
        <span className="font-semibold">{entry.name}</span>
      </div>
      <div className="mt-0.5 tabular-nums font-medium opacity-80">
        {value} rabbit{value === 1 ? "" : "s"} · {pct}%
      </div>
    </div>
  )
}

// Slightly enlarges the hovered slice and adds a crisp outer ring, so the
// active breed reads clearly without a distracting default halo.
function renderActiveSlice(props: PieSectorDataItem) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={(outerRadius as number) + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={(innerRadius as number) - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
      />
    </g>
  )
}

export function PopulationByBreedChart({ data }: { data: BreedPopulationSlice[] }) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No rabbits recorded yet.
      </div>
    )
  }

  const colored = data.map((d, i) => ({ ...d, fill: breedColor(i) }))
  const active = activeIndex !== undefined ? colored[activeIndex] : undefined

  return (
    <div className="space-y-3">
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={colored}
              dataKey="count"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveSlice}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {colored.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<BreedTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — total count, or the hovered breed's share */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {active ? active.count : total}
          </span>
          <span className="mt-1 max-w-[7rem] truncate text-center text-[11px] text-muted-foreground">
            {active ? active.name : "active"}
          </span>
        </div>
      </div>

      {/* Custom legend — swatch + name + count + share. A single column
          gives each breed the full card width to render its name (the
          2-column layout was truncating anything past ~8 characters); the
          native title attribute is a fallback for names still too long to
          fit even at full width. Scrollable so a long breed list never
          pushes the card taller than its neighbors. */}
      <div className="flex max-h-28 flex-col gap-0.5 overflow-y-auto pr-1 text-xs">
        {colored
          .slice()
          .sort((a, b) => b.count - a.count)
          .map((entry) => {
            const i = colored.indexOf(entry)
            const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0
            return (
              <button
                key={entry.name}
                type="button"
                title={entry.name}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(undefined)}
                className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left transition-colors hover:bg-muted"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="min-w-0 flex-1 truncate text-foreground">{entry.name}</span>
                <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">
                  {entry.count} · {pct}%
                </span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
