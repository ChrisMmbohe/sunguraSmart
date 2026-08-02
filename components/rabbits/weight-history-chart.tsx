"use client"

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { WeightHistoryPoint } from "@/app/rabbits/types"

const dateFormatter = new Intl.DateTimeFormat("en-KE", { month: "short", day: "numeric" })

export function WeightHistoryChart({ data }: { data: WeightHistoryPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No weight readings logged yet.
      </div>
    )
  }

  if (data.length === 1) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-1 text-center">
        <span className="text-2xl font-semibold tabular-nums">{data[0].weightKg.toFixed(2)} kg</span>
        <span className="text-xs text-muted-foreground">
          Only one reading so far ({dateFormatter.format(new Date(data[0].date))}) — log another to see a trend.
        </span>
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, label: dateFormatter.format(new Date(d.date)) }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          domain={["dataMin - 0.2", "dataMax + 0.2"]}
          tickFormatter={(v: number) => v.toFixed(1)}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toFixed(2)} kg`, "Weight"]}
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(var(--chart-2))" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
