"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ChartConfig {
  name: string;
  color: string;
  key: string;
}

interface DashboardChartProps {
  title: string;
  data: DataPoint[];
  config: ChartConfig[];
  isLoading?: boolean;
  height?: number;
  type?: "line" | "bar" | "area";
  showLegend?: boolean;
  showGrid?: boolean;
  description?: string;
  className?: string;
}

/**
 * DashboardChart Component
 * A flexible chart component for displaying trends and analytics
 * Uses SVG-based charts for simplicity without external dependencies
 */
export function DashboardChart({
  title,
  data,
  config,
  isLoading = false,
  height = 300,
  type = "line",
  showLegend = true,
  showGrid = true,
  description,
  className = "",
}: DashboardChartProps) {
  const width = 800;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (isLoading) {
    return (
      <div
        className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}
      >
        <Skeleton className="h-6 w-48 mb-2" />
        {description && <Skeleton className="h-4 w-96 mb-4" />}
        <Skeleton
          className="w-full"
          style={{ height: `${height}px`, marginTop: "1rem" }}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div
          className="flex items-center justify-center text-muted-foreground"
          style={{ height: `${height}px` }}
        >
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Calculate scales
  const allValues = config.flatMap((c) =>
    data.map((d) => (typeof d[c.key] === "number" ? (d[c.key] as number) : 0))
  );
  const numericValues = allValues.filter((v): v is number => typeof v === "number");
  const maxValue = Math.max(...numericValues, 1);
  const minValue = Math.min(...numericValues, 0);
  const range = maxValue - minValue || 1;

  const xScale = (index: number) =>
    padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
  const yScale = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  // Simple SVG path builder
  const buildPath = (key: string) => {
    if (data.length === 0) return "";
    const points = data.map((d, i) => {
      const x = xScale(i);
      const y = yScale(typeof d[key] === "number" ? d[key] : 0);
      return `${x},${y}`;
    });
    return points.join(" ");
  };

  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="relative overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="mx-auto"
          style={{ minWidth: "100%" }}
        >
          {/* Background grid */}
          {showGrid && (
            <>
              {Array.from({ length: 5 }).map((_, i) => {
                const y =
                  padding.top + (chartHeight / 4) * i;
                return (
                  <line
                    key={`grid-h-${i}`}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.05"
                    strokeDasharray="4"
                  />
                );
              })}
            </>
          )}

          {/* Y-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = minValue + (range / 4) * i;
            const y = padding.top + (chartHeight / 4) * (4 - i);
            return (
              <text
                key={`y-label-${i}`}
                x={padding.left - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
                opacity="0.6"
              >
                {Math.round(value)}
              </text>
            );
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="currentColor"
            strokeOpacity="0.2"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="currentColor"
            strokeOpacity="0.2"
          />

          {/* Data visualization */}
          {type === "line" &&
            config.map((c) => (
              <polyline
                key={`line-${c.key}`}
                points={buildPath(c.key)}
                fill="none"
                stroke={c.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            ))}

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) {
              return null;
            }
            const x = xScale(i);
            return (
              <g key={`x-label-${i}`}>
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.6"
                >
                  {String(d.name).length > 10
                    ? `${String(d.name).substring(0, 10)}...`
                    : d.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-6">
          {config.map((c) => (
            <div key={`legend-${c.key}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-sm text-muted-foreground">{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { DataPoint, ChartConfig };
