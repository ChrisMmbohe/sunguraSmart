/**
 * hooks/useDashboardData.ts
 * Custom hook for fetching and managing dashboard data
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ActivityItem } from '@/components/RecentActivity';
import type { UpcomingTask } from '@/components/UpcomingTasks';

/**
 * Dashboard data structure matching the API response
 */
export interface DashboardData {
  stats: {
    totalRabbits: number;
    activeBreeding: number;
    recentSales: number;
    healthAlerts: number;
  };
  trends: {
    rabbits: number;
    breeding: number;
    sales: number;
    health: number;
  };
  chartData: Array<{
    date: string;
    rabbits: number;
    sales: number;
    vaccinations: number;
    weights: number;
  }>;
  activities: ActivityItem[];
  tasks: UpcomingTask[];
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'success';
    title: string;
    description: string;
    dismissible?: boolean;
  }>;
}

interface UseDashboardDataOptions {
  /**
   * Initial data to use before fetching
   */
  initialData?: DashboardData;
  /**
   * Time range in days (default: 30)
   */
  timeRange?: number;
  /**
   * Whether to auto-refresh on mount
   */
  autoRefresh?: boolean;
  /**
   * Interval in ms to auto-refresh (default: 60000)
   */
  refreshInterval?: number;
}

interface UseDashboardDataReturn {
  /**
   * Current dashboard data
   */
  data: DashboardData | null;
  /**
   * Is the data currently loading
   */
  isLoading: boolean;
  /**
   * Error message if loading failed
   */
  error: string | null;
  /**
   * Manual refresh function
   */
  refetch: () => Promise<void>;
  /**
   * Set the timeRange and fetch new data
   */
  setTimeRange: (range: number) => void;
}

/**
 * Hook to fetch and manage dashboard data
 * Provides loading, error, and refetch capabilities
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useDashboardData({
 *   timeRange: 30,
 *   autoRefresh: true,
 * });
 * ```
 */
export function useDashboardData(
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn {
  const {
    initialData,
    timeRange = 30,
    autoRefresh = false,
    refreshInterval = 60000,
  } = options;

  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeRange, setCurrentTimeRange] = useState(timeRange);

  /**
   * Fetch dashboard data from the API
   */
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard?timeRange=${currentTimeRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch dashboard data: ${response.status} ${response.statusText}`
        );
      }

      const dashboardData: DashboardData = await response.json();

      // Convert ISO strings to Date objects
      const processedData: DashboardData = {
        ...dashboardData,
        activities: dashboardData.activities.map((activity) => ({
          ...activity,
          timestamp:
            typeof activity.timestamp === 'string'
              ? new Date(activity.timestamp)
              : activity.timestamp,
        })),
        tasks: dashboardData.tasks.map((task) => ({
          ...task,
          dueDate:
            typeof task.dueDate === 'string'
              ? new Date(task.dueDate)
              : task.dueDate,
        })),
      };

      setData(processedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      console.error('[useDashboardData] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentTimeRange]);

  /**
   * Handle timeRange changes
   */
  const handleSetTimeRange = useCallback((range: number) => {
    setCurrentTimeRange(range);
  }, []);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    if (!initialData) {
      refetch();
    }
  }, [initialData, refetch]);

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setTimeRange: handleSetTimeRange,
  };
}
