"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Maximize2 } from "lucide-react";

interface DataPoint {
  [key: string]: string | number;
}

interface InteractiveChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  type?: "line" | "bar" | "pie";
  dataKeys?: string[];
  colors?: string[];
  isLoading?: boolean;
  height?: number;
  timeRange?: "7d" | "30d" | "90d" | "1y";
  onTimeRangeChange?: (range: "7d" | "30d" | "90d" | "1y") => void;
  showExport?: boolean;
  showFullscreen?: boolean;
  tooltip?: boolean;
  legend?: boolean;
  className?: string;
}

const CHART_COLORS = [
  "#0ea5e9", // cyan-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

export function InteractiveChart({
  title,
  description,
  data,
  type = "line",
  dataKeys = [],
  colors = CHART_COLORS,
  isLoading = false,
  height = 300,
  timeRange = "30d",
  onTimeRangeChange,
  showExport = false,
  showFullscreen = false,
  tooltip = true,
  legend = true,
  className = "",
}: InteractiveChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    new Set(dataKeys)
  );

  const chartHeight = isFullscreen ? "80vh" : height;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-card-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex gap-2 items-center text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-card-foreground">
              {typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleLegendClick = (data: any) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(data.dataKey)) {
      newSelected.delete(data.dataKey);
    } else {
      newSelected.add(data.dataKey);
    }
    setSelectedKeys(newSelected);
  };

  const filteredDataKeys = dataKeys.filter((key) => selectedKeys.has(key));

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No data available</p>
        </div>
      );
    }

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
              <YAxis stroke="currentColor" opacity={0.5} />
              {tooltip && <Tooltip content={<CustomTooltip />} />}
              {legend && (
                <Legend
                  onClick={(e) => handleLegendClick(e)}
                  wrapperStyle={{ cursor: "pointer" }}
                />
              )}
              {filteredDataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill={colors[0]}
                dataKey={filteredDataKeys[0] || "value"}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {tooltip && <Tooltip content={<CustomTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case "line":
      default:
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
              <YAxis stroke="currentColor" opacity={0.5} />
              {tooltip && <Tooltip content={<CustomTooltip />} />}
              {legend && (
                <Legend
                  onClick={(e) => handleLegendClick(e)}
                  wrapperStyle={{ cursor: "pointer" }}
                />
              )}
              {filteredDataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`rounded-xl border bg-card p-6 ${className}`}>
        <Skeleton className="h-6 w-48 mb-2" />
        {description && <Skeleton className="h-4 w-96 mb-4" />}
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {onTimeRangeChange && (
            <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/50">
              {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTimeRangeChange(range)}
                  className="text-xs"
                >
                  {range === "7d" && "7D"}
                  {range === "30d" && "30D"}
                  {range === "90d" && "90D"}
                  {range === "1y" && "1Y"}
                </Button>
              ))}
            </div>
          )}

          {showFullscreen && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}

          {showExport && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // Export functionality can be implemented
                console.log("Export chart data");
              }}
              title="Export data"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: chartHeight }}>
        {renderChart()}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <Button
              variant="outline"
              onClick={() => setIsFullscreen(false)}
              className="bg-card"
            >
              Close
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center bg-card rounded-lg">
            <div style={{ width: "100%", height: "100%" }}>
              {renderChart()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { InteractiveChartProps, DataPoint };
