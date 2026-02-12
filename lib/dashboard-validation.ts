/**
 * lib/dashboard-validation.ts
 * Validation utilities for dashboard API (lightweight, no external dependencies)
 */

/**
 * Query parameters for dashboard API
 */
export interface DashboardQuery {
  timeRange: string;
}

/**
 * Validate dashboard query parameters
 * @param query The query parameters to validate
 * @returns Validated query object
 */
export function validateDashboardQuery(
  query: Record<string, string | string[] | undefined>
): DashboardQuery {
  let timeRange = query.timeRange;

  // Handle array case
  if (Array.isArray(timeRange)) {
    timeRange = timeRange[0];
  }

  // Default to 30d if not provided
  if (!timeRange) {
    timeRange = '30d';
  }

  // Validate format (accept "30", "30d", etc.)
  if (!/^\d+d?$/.test(timeRange)) {
    throw new Error('timeRange must be a number (e.g., "30" or "30d")');
  }

  // Normalize: add 'd' suffix if missing
  if (!timeRange.endsWith('d')) {
    timeRange = timeRange + 'd';
  }

  return { timeRange };
}

/**
 * Validate that a value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

/**
 * Validate that a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Validate ISO date string or Date object
 */
export function isValidDate(value: unknown): boolean {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

/**
 * Validate dashboard stats object
 */
export function isValidStats(stats: unknown): boolean {
  if (typeof stats !== 'object' || stats === null) return false;

  const s = stats as Record<string, unknown>;
  return (
    isPositiveInteger(s.totalRabbits) &&
    isPositiveInteger(s.activeBreeding) &&
    isPositiveInteger(s.recentSales) &&
    isPositiveInteger(s.healthAlerts)
  );
}

/**
 * Validate dashboard trends object
 */
export function isValidTrends(trends: unknown): boolean {
  if (typeof trends !== 'object' || trends === null) return false;

  const t = trends as Record<string, unknown>;
  return (
    Number.isInteger(t.rabbits) &&
    Number.isInteger(t.breeding) &&
    Number.isInteger(t.sales) &&
    Number.isInteger(t.health)
  );
}

/**
 * Validate chart data point
 */
export function isValidChartDataPoint(point: unknown): boolean {
  if (typeof point !== 'object' || point === null) return false;

  const p = point as Record<string, unknown>;
  return (
    typeof p.date === 'string' &&
    isPositiveInteger(p.rabbits) &&
    isNumber(p.sales) &&
    isPositiveInteger(p.vaccinations) &&
    isPositiveInteger(p.weights)
  );
}

/**
 * Validate activity item
 */
export function isValidActivityItem(activity: unknown): boolean {
  if (typeof activity !== 'object' || activity === null) return false;

  const a = activity as Record<string, unknown>;
  const validTypes = ['breeding', 'sale', 'health', 'litter', 'alert', 'milestone'];
  const validStatuses = ['success', 'warning', 'alert', 'info'];

  return (
    typeof a.id === 'string' &&
    a.id.length > 0 &&
    typeof a.type === 'string' &&
    validTypes.includes(a.type) &&
    typeof a.title === 'string' &&
    a.title.length > 0 &&
    isValidDate(a.timestamp) &&
    (!a.status || validStatuses.includes(a.status as string))
  );
}

/**
 * Validate upcoming task
 */
export function isValidUpcomingTask(task: unknown): boolean {
  if (typeof task !== 'object' || task === null) return false;

  const t = task as Record<string, unknown>;
  const validTypes = ['kindling', 'weaning', 'vaccination', 'health', 'breeding', 'nest', 'other'];
  const validPriorities = ['low', 'medium', 'high', 'critical'];

  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.title === 'string' &&
    t.title.length > 0 &&
    isValidDate(t.dueDate) &&
    typeof t.priority === 'string' &&
    validPriorities.includes(t.priority) &&
    typeof t.type === 'string' &&
    validTypes.includes(t.type)
  );
}

/**
 * Validate alert
 */
export function isValidAlert(alert: unknown): boolean {
  if (typeof alert !== 'object' || alert === null) return false;

  const a = alert as Record<string, unknown>;
  const validTypes = ['error', 'warning', 'success'];

  return (
    typeof a.id === 'string' &&
    a.id.length > 0 &&
    typeof a.type === 'string' &&
    validTypes.includes(a.type) &&
    typeof a.title === 'string' &&
    a.title.length > 0 &&
    typeof a.description === 'string' &&
    a.description.length > 0
  );
}

/**
 * Validate complete dashboard response
 */
export function isValidDashboardData(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  return (
    isValidStats(d.stats) &&
    isValidTrends(d.trends) &&
    Array.isArray(d.chartData) &&
    (d.chartData as unknown[]).every((item) => isValidChartDataPoint(item)) &&
    Array.isArray(d.activities) &&
    (d.activities as unknown[]).every((item) => isValidActivityItem(item)) &&
    Array.isArray(d.tasks) &&
    (d.tasks as unknown[]).every((item) => isValidUpcomingTask(item)) &&
    Array.isArray(d.alerts) &&
    (d.alerts as unknown[]).every((item) => isValidAlert(item))
  );
}

/**
 * Safe validation that returns result or error
 */
export function safeDashboardValidation(data: unknown) {
  try {
    if (isValidDashboardData(data)) {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: { errors: [{ message: 'Invalid dashboard data structure' }] },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        errors: [
          {
            message: error instanceof Error ? error.message : 'Validation error',
          },
        ],
      },
    };
  }
}

