"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
})

export interface MonthlyFinancePoint {
  month: string // e.g. "Feb"
  revenue: number
  expenses: number
}

export function RevenueExpenseChart({ data }: { data: MonthlyFinancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
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
          width={56}
          tickFormatter={(v: number) => currencyFormatter.format(v)}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          formatter={(value) => currencyFormatter.format(Number(value ?? 0))}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground capitalize">{value}</span>
          )}
        />
        <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export interface BreedPopulationSlice {
  name: string
  count: number
}

export function PopulationByBreedChart({ data }: { data: BreedPopulationSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No rabbits recorded yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          innerRadius={64}
          outerRadius={92}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const v = Number(value ?? 0)
            return [`${v} (${((v / total) * 100).toFixed(0)}%)`, String(name ?? "")]
          }}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
