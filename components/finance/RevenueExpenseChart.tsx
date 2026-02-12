'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendData {
  date: string;
  revenue: number;
  expenses: number;
}

interface RevenueExpenseChartProps {
  data: TrendData[];
  isLoading?: boolean;
}

export function RevenueExpenseChart({
  data = [],
  isLoading = false,
}: RevenueExpenseChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
          <CardDescription>Daily trends over selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
          <CardDescription>Daily trends over selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.expenses))
  );
  const chartHeight = 300;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
        <CardDescription>Daily trends over selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="relative" style={{ minWidth: '100%', height: chartHeight }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground pr-2 text-right">
              <span>${(maxValue).toLocaleString()}</span>
              <span>${(maxValue * 0.5).toLocaleString()}</span>
              <span>$0</span>
            </div>

            {/* Chart area */}
            <div className="ml-14 pr-4 h-full flex items-end justify-between gap-2 relative">
              {data.map((item, idx) => {
                const revenuePct =
                  maxValue > 0 ? (item.revenue / maxValue) * 100 : 0;
                const expensePct =
                  maxValue > 0 ? (item.expenses / maxValue) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    {/* Bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-64">
                      {/* Revenue bar */}
                      {item.revenue > 0 && (
                        <div
                          className="flex-1 bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-help"
                          style={{ height: `${revenuePct}%` }}
                          title={`Revenue: $${item.revenue.toLocaleString()}`}
                        />
                      )}
                      {/* Expense bar */}
                      {item.expenses > 0 && (
                        <div
                          className="flex-1 bg-red-500 rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-help"
                          style={{ height: `${expensePct}%` }}
                          title={`Expenses: $${item.expenses.toLocaleString()}`}
                        />
                      )}
                    </div>
                    {/* X-axis label */}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-sm text-muted-foreground">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
