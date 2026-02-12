'use client';

import React, { useState, useEffect } from 'react';
import { PeriodSelector } from '@/components/finance/PeriodSelector';
import { KPICard } from '@/components/finance/KPICard';
import { RevenueExpenseChart } from '@/components/finance/RevenueExpenseChart';
import { CategoryBreakdown } from '@/components/finance/CategoryBreakdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface FinanceData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByType: Array<{ type: string; amount: number; count: number }>;
  expensesByCategory: Array<{ category: string; amount: number; count: number }>;
  recentSales: Array<{
    id: string;
    transaction_date: string;
    amount_usd: number;
    item_type: string;
    byproduct_type?: string;
    quantity_sold: number;
  }>;
  recentExpenses: Array<{
    id: string;
    transaction_date: string;
    amount_usd: number;
    category: string;
    description: string;
  }>;
  dailyTrends?: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
}

export function FinancePageClient() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<FinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinanceData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/finance?period=${period}&userId=user_35OANY8FLr0alL39uNrIT2qD37v`);
        if (!response.ok) {
          throw new Error('Failed to fetch finance data');
        }
        const financeData = await response.json();
        setData(financeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Finance data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinanceData();
  }, [period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your farm&apos;s financial performance and track revenue vs. expenses
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PeriodSelector
            selectedPeriod={period}
            onPeriodChange={handlePeriodChange}
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Section */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <KPICard
            title="Total Revenue"
            value={data.totalRevenue}
            description={`from ${
              data.revenueByType.reduce((sum, item) => sum + item.count, 0) || 0
            } sales`}
            prefix="$"
            icon={<DollarSign className="h-8 w-8" />}
            variant="success"
          />

          {/* Total Expenses */}
          <KPICard
            title="Total Expenses"
            value={data.totalExpenses}
            description={`in ${
              data.expensesByCategory.reduce((sum, item) => sum + item.count, 0) || 0
            } transactions`}
            prefix="$"
            icon={<DollarSign className="h-8 w-8" />}
            variant="warning"
          />

          {/* Net Profit/Loss */}
          <KPICard
            title="Net Profit/Loss"
            value={data.netProfit}
            prefix="$"
            icon={<TrendingUp className="h-8 w-8" />}
            variant={data.netProfit >= 0 ? 'success' : 'danger'}
            trend={data.netProfit >= 0 ? 'up' : 'down'}
          />

          {/* Profit Margin */}
          <KPICard
            title="Profit Margin"
            value={data.profitMargin.toFixed(1)}
            suffix="%"
            description="of total revenue"
            variant={data.profitMargin >= 20 ? 'success' : data.profitMargin >= 0 ? 'warning' : 'danger'}
            trend={data.profitMargin >= 20 ? 'up' : 'down'}
          />
        </div>
      ) : null}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses Chart */}
        <div className="lg:col-span-2">
          <RevenueExpenseChart
            data={data?.dailyTrends || []}
            isLoading={isLoading}
          />
        </div>

        {/* Revenue Breakdown */}
        <CategoryBreakdown
          title="Revenue by Item Type"
          description="Breakdown of revenue sources"
          data={data?.revenueByType || []}
          isLoading={isLoading}
        />

        {/* Expenses Breakdown */}
        <CategoryBreakdown
          title="Expenses by Category"
          description="Distribution of farm expenses"
          data={data?.expensesByCategory || []}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Transactions Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Recent Sales</CardTitle>
            <CardDescription>Latest revenue transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recentSales && data.recentSales.length > 0 ? (
              <div className="space-y-3">
                {data.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sale.item_type}</p>
                      {sale.byproduct_type && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {sale.byproduct_type}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sale.transaction_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit',
                        })}{' '}
                        • Qty: {sale.quantity_sold}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +${sale.amount_usd.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No sales recorded yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Recent Expenses</CardTitle>
            <CardDescription>Latest expense transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recentExpenses && data.recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {data.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{expense.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {expense.description.substring(0, 40)}
                        {expense.description.length > 40 ? '...' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(expense.transaction_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        -${expense.amount_usd.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No expenses recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
