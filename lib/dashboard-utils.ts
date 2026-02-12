/**
 * lib/dashboard-utils.ts
 * Utility functions for dashboard data processing and calculations
 */

import { format, subDays, eachDayOfInterval } from 'date-fns';

/**
 * Represents aggregated daily metrics for charting
 */
export interface DailyMetrics {
  date: string;
  rabbits: number;
  sales: number;
  vaccinations: number;
  weights: number;
}

/**
 * Represents a dashboard activity entry
 */
export interface DashboardActivity {
  id: string;
  type: 'breeding' | 'sale' | 'health' | 'litter' | 'alert' | 'milestone';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'alert' | 'info';
  relatedId?: string;
  relatedType?: 'rabbit' | 'litter' | 'breeding';
  metadata?: Record<string, unknown>;
}

/**
 * Calculate the percentage change between two values
 * @param current Current period value
 * @param previous Previous period value
 * @returns Percentage change (can be negative)
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Generate an array of dates for a specified number of days
 * @param days Number of days to generate
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function generateDateRange(days: number): string[] {
  const now = new Date();
  const startDate = subDays(now, days);
  const dateInterval = eachDayOfInterval({ start: startDate, end: now });
  return dateInterval.map((date) => format(date, 'yyyy-MM-dd'));
}

/**
 * Determine priority level based on thresholds
 * @param daysUntilDue Number of days until task is due
 * @returns Priority level
 */
export function determinePriority(
  daysUntilDue: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (daysUntilDue < 0) return 'critical';
  if (daysUntilDue === 0) return 'critical';
  if (daysUntilDue <= 3) return 'high';
  if (daysUntilDue <= 7) return 'medium';
  return 'low';
}

/**
 * Format currency for display
 * @param amount Amount in dollars
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Aggregate activities by type for trend analysis
 * @param activities Array of activities
 * @returns Object with activity counts by type
 */
export function aggregateActivitiesByType(
  activities: DashboardActivity[]
): Record<string, number> {
  return activities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Filter activities by date range
 * @param activities Array of activities
 * @param startDate Start date for filtering
 * @param endDate End date for filtering
 * @returns Filtered activities
 */
export function filterActivitiesByDateRange(
  activities: DashboardActivity[],
  startDate: Date,
  endDate: Date
): DashboardActivity[] {
  return activities.filter((activity) => {
    const timestamp = new Date(activity.timestamp);
    return timestamp >= startDate && timestamp <= endDate;
  });
}

/**
 * Group activities by date
 * @param activities Array of activities
 * @returns Object with activities grouped by date string
 */
export function groupActivitiesByDate(
  activities: DashboardActivity[]
): Record<string, DashboardActivity[]> {
  return activities.reduce(
    (acc, activity) => {
      const dateStr = format(new Date(activity.timestamp), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(activity);
      return acc;
    },
    {} as Record<string, DashboardActivity[]>
  );
}

/**
 * Calculate average metric value from daily metrics
 * @param metrics Array of daily metrics
 * @param metricKey Key of metric to average
 * @returns Average value
 */
export function calculateMetricAverage(
  metrics: DailyMetrics[],
  metricKey: 'rabbits' | 'sales' | 'vaccinations' | 'weights'
): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, m) => acc + m[metricKey], 0);
  return Math.round(sum / metrics.length);
}

/**
 * Get the peak value from daily metrics
 * @param metrics Array of daily metrics
 * @param metricKey Key of metric to find peak
 * @returns Peak value and the date it occurred
 */
export function getMetricPeak(
  metrics: DailyMetrics[],
  metricKey: 'rabbits' | 'sales' | 'vaccinations' | 'weights'
): { value: number; date: string } | null {
  if (metrics.length === 0) return null;

  let maxValue = 0;
  let maxDate = '';

  for (const metric of metrics) {
    if (metric[metricKey] > maxValue) {
      maxValue = metric[metricKey];
      maxDate = metric.date;
    }
  }

  return { value: maxValue, date: maxDate };
}

/**
 * Calculate week-over-week metrics
 * @param currentWeek Array of metrics from current week
 * @param previousWeek Array of metrics from previous week
 * @param metricKey Key of metric to compare
 * @returns Percentage change
 */
export function calculateWeekOverWeekChange(
  currentWeek: DailyMetrics[],
  previousWeek: DailyMetrics[],
  metricKey: 'rabbits' | 'sales' | 'vaccinations' | 'weights'
): number {
  const currentSum = currentWeek.reduce((acc, m) => acc + m[metricKey], 0);
  const previousSum = previousWeek.reduce((acc, m) => acc + m[metricKey], 0);

  return calculatePercentageChange(currentSum, previousSum);
}
