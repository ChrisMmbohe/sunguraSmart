## Dashboard Backend API - Implementation Guide

A robust, production-ready backend API for the rabbit farm management dashboard, built with Next.js 16, Mongoose, and Clerk authentication.

---

## Overview

The Dashboard API (`/api/dashboard`) provides real-time aggregated data from MongoDB to the interactive dashboard component, replacing mock data generators. The API handles:

- **Statistics**: Total rabbits, active breedings, recent sales, health alerts
- **Trends**: Percentage changes in key metrics (current vs. previous period)
- **Chart Data**: 30-day time-series data for visualization
- **Activities**: Recent events (breedings, litters, sales, health alerts)
- **Tasks**: Upcoming critical events (weaning, vaccinations, breeding windows)
- **Alerts**: Dynamic alerts based on thresholds and conditions

---

## Architecture

### File Structure

```
app/
├── api/
│   └── dashboard/
│       └── route.ts          # Main GET /api/dashboard endpoint
└── dashboard/
    ├── page.tsx              # Dashboard page wrapper
    └── enhanced-dashboard.tsx # Dashboard component with real data fetching

lib/
├── mongodb.ts                # MongoDB connection (existing)
├── dashboard-utils.ts        # Utility functions for data processing
└── dashboard-validation.ts   # Input/output validation

hooks/
└── useDashboardData.ts       # React hook for managing dashboard data

database/
├── index.ts                  # Model exports and initialization
├── rabbit.model.ts           # Rabbit data model
├── breeding.model.ts         # Breeding data model
├── sale.model.ts             # Sale data model
├── health-record.model.ts    # Health record data model
└── litter.model.ts           # Litter data model
```

---

## API Endpoint

### GET `/api/dashboard`

Fetches aggregated dashboard data for the authenticated user.

#### Authentication

- **Required**: Clerk authentication via `auth()` from `@clerk/nextjs/server`
- **Header**: User ID is automatically extracted from the JWT token
- **Returns**: `401 Unauthorized` if not authenticated

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeRange` | string | `30d` | Time range for data aggregation (format: `\d+d`) |

**Examples**:
- `GET /api/dashboard` → 30 days of data
- `GET /api/dashboard?timeRange=7d` → 7 days of data
- `GET /api/dashboard?timeRange=90d` → 90 days of data

#### Response Format

```typescript
interface DashboardData {
  stats: {
    totalRabbits: number;
    activeBreeding: number;
    recentSales: number;
    healthAlerts: number;
  };
  trends: {
    rabbits: number;        // percentage change
    breeding: number;       // percentage change
    sales: number;          // percentage change
    health: number;         // percentage change
  };
  chartData: Array<{
    date: string;           // YYYY-MM-DD format
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
```

#### Response Example

```json
{
  "stats": {
    "totalRabbits": 42,
    "activeBreeding": 8,
    "recentSales": 12,
    "healthAlerts": 2
  },
  "trends": {
    "rabbits": 5,
    "breeding": 12,
    "sales": 8,
    "health": -15
  },
  "chartData": [
    {
      "date": "2025-12-26",
      "rabbits": 2,
      "sales": 0,
      "vaccinations": 0,
      "weights": 0
    }
  ],
  "activities": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "breeding",
      "title": "Breeding Recorded",
      "description": "R001 (Doe) bred with R002 (Buck)",
      "timestamp": "2025-12-26T10:30:00.000Z",
      "status": "success",
      "relatedId": "507f1f77bcf86cd799439011",
      "relatedType": "breeding"
    }
  ],
  "tasks": [
    {
      "id": "weaning-9439",
      "title": "Weaning - Litter #9439",
      "description": "Separate 8 kits from doe",
      "dueDate": "2026-01-23T00:00:00.000Z",
      "priority": "high",
      "type": "weaning",
      "relatedId": "507f1f77bcf86cd799439012",
      "href": "/litters",
      "isDismissible": true
    }
  ],
  "alerts": [
    {
      "id": "health-alert",
      "type": "error",
      "title": "Health Alert",
      "description": "2 rabbit(s) showing signs of illness - immediate attention required",
      "dismissible": false
    }
  ]
}
```

#### Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Data returned |
| `400` | Bad Request - Invalid query parameters |
| `401` | Unauthorized - No valid user authentication |
| `500` | Server Error - Database or processing error |

---

## Data Aggregation Details

### Statistics (`computeStats`)

Counts records across all models filtered by:
- **totalRabbits**: Non-terminal rabbits (not Culled, Deceased, or Sold)
- **activeBreeding**: Upcoming breedings not yet successful
- **recentSales**: Sales in the last 30 days
- **healthAlerts**: Active health records with no end date

### Trends (`computeTrends`)

Compares current period (last N days) with previous period (N days before that):
- Calculates percentage change for each metric
- Positive/negative indicates improvement/decline
- Formula: `((current - previous) / previous) * 100`

### Chart Data (`computeChartData`)

Time-series aggregation:
- Creates 30-day (or custom range) daily data points
- Groups events by date using MongoDB queries
- Includes: rabbit count, sales, vaccinations, weights (if available)
- Date format: `YYYY-MM-DD`

### Activities (`fetchActivities`)

Fetches recent events in order of recency:
1. **Breedings**: Latest 5 with breeding status
2. **Litters**: Latest 5 with kit survival info
3. **Sales**: Latest 5 with transaction details
4. **Health Alerts**: Latest 5 active health issues
5. **Merged & sorted**: Returns 10 most recent

### Tasks (`fetchTasks`)

Identifies upcoming important events:
1. **Weaning**: Litters due for weaning (28+ days post-kindling)
2. **Vaccinations**: Active health issues requiring follow-up
3. **Breeding Windows**: Receptive does available for breeding
4. **Sorted**: By due date (soonest first)

### Alerts (`generateAlerts`)

Dynamic alerts based on thresholds:
- **Health Alert**: If 1+ active health records
- **Overdue Weaning**: If litters overdue (35+ days without weaning)
- **Health Checkup Due**: If rabbits not updated in 30+ days
- **Status Good**: If no issues detected

---

## Frontend Integration

### Using the Custom Hook

The recommended way to fetch dashboard data in React components:

```tsx
import { useDashboardData } from '@/hooks/useDashboardData';

export function MyDashboard() {
  const { data, isLoading, error, refetch, setTimeRange } = useDashboardData({
    timeRange: 30,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Use data properties */}
      <StatCard value={data?.stats.totalRabbits} />
      {/* Update timeRange */}
      <button onClick={() => setTimeRange(7)}>Last 7 days</button>
      {/* Manual refresh */}
      <button onClick={refetch}>Refresh Now</button>
    </div>
  );
}
```

### Direct Fetch Usage

```tsx
'use client';

import { useEffect, useState } from 'react';

export function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard?timeRange=30')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Total Rabbits: {data.stats.totalRabbits}</h1>
      {/* ... render with data */}
    </div>
  );
}
```

### Enhanced Dashboard Component

The dashboard is automatically updated to fetch real data:

```tsx
// app/dashboard/enhanced-dashboard.tsx
export function EnhancedDashboard({
  initialData,
  userId,
}: EnhancedDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData(); // Fetches from /api/dashboard
    }
  }, [initialData, selectedTimeRange]);

  // ... component rendering
}
```

---

## Validation

The API includes comprehensive validation:

### Input Validation (`dashboard-validation.ts`)

- **Query Parameters**: Validates `timeRange` format (`\d+d`)
- **Returns**: `400 Bad Request` if invalid

### Output Validation

- **Response Schema**: Validates all data types and structures before returning
- **Safety Checks**: Uses lightweight validation without external dependencies
- **Error Details**: Returns validation errors in response if validation fails

---

## Error Handling

### Graceful Degradation

- **Database Errors**: Logs error, returns empty arrays/zeros instead of crashing
- **Authentication Failures**: Returns `401` with message
- **Validation Errors**: Returns `400` with details
- **Server Errors**: Returns `500` with error message

### Logging

All operations are logged for debugging:

```
[Dashboard API] Fetching data for userId: user_123, timeRange: 30d
[Dashboard API] Successfully fetched dashboard data
[computeStats] Error: ...
[fetchActivities] Error: ...
```

---

## Performance Optimization

### Database Queries

- **Parallel Execution**: Uses `Promise.all()` to fetch multiple models simultaneously
- **Field Selection**: `.select()` only required fields to reduce document size
- **Indexing**: Relies on existing indexes on `user_id`, `status`, `date` fields

### Caching

- **HTTP Cache**: Response has `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`
- **Client-side Caching**: Hook supports auto-refresh intervals
- **Query Optimization**: Avoids N+1 queries with proper aggregations

### Pagination

- **Activities**: Limited to 10 most recent
- **Tasks**: Limited to 10 upcoming
- **Chart Data**: Limited to 30 days by default

---

## Extending the API

### Adding New Metrics

1. Create an aggregation function:

```typescript
async function computeNewMetric(userId: string) {
  try {
    const result = await Model.countDocuments({ user_id: userId });
    return result;
  } catch (error) {
    console.error('[computeNewMetric] Error:', error);
    return 0;
  }
}
```

2. Add to GET handler parallel fetch:

```typescript
const [
  stats,
  trends,
  chartData,
  activities,
  tasks,
  alerts,
  newMetric, // Add here
] = await Promise.all([
  computeStats(userId),
  computeTrends(userId, now, startDate, startDatePrevious),
  computeChartData(userId, timeRange),
  fetchActivities(userId),
  fetchTasks(userId),
  generateAlerts(userId),
  computeNewMetric(userId), // Add here
]);
```

3. Update `DashboardData` interface to include new metric

### Adding New Activity Types

1. Add type to `ActivityItem` interface in `components/RecentActivity.tsx`
2. Create fetch function in API route
3. Add to activities array in `fetchActivities()`

### Adding Custom Alerts

Extend `generateAlerts()` with new conditions:

```typescript
// Check custom threshold
if (someCondition) {
  alerts.push({
    id: 'custom-alert-id',
    type: 'warning',
    title: 'Custom Alert',
    description: 'Description of issue',
    dismissible: true,
  });
}
```

---

## Testing the API

### Manual Testing with cURL

```bash
# Get 30-day data
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:3000/api/dashboard?timeRange=30d

# Get 7-day data
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:3000/api/dashboard?timeRange=7d
```

### Using Browser DevTools

1. Open Dashboard page in browser
2. Open Network tab
3. Look for `/api/dashboard` requests
4. Inspect response payload

### Testing with Sample Data

Assuming you have a SEED_API_SECRET configured:

1. Seed database with test data
2. Authenticate as test user
3. Make API request
4. Verify response format and data

---

## Environment Variables

Ensure `.env.local` contains:

```
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

---

## Common Issues

### "Unauthorized" Response

- ✅ Check Clerk is properly configured
- ✅ Verify user is authenticated in browser
- ✅ Check JWT token is valid

### Empty Data Fields

- ✅ Database might be empty (seed data first)
- ✅ Check `user_id` filtering is working
- ✅ Verify model indexes are created

### Slow API Responses

- ✅ Check MongoDB query performance (use `explain()`)
- ✅ Add indexes on frequently queried fields
- ✅ Reduce `timeRange` for testing
- ✅ Check network latency

### Validation Errors

- ✅ Ensure all required fields are present in response
- ✅ Check date formats are ISO 8601
- ✅ Verify numeric fields are numbers, not strings

---

## API Response Time Targets

- **Typical**: 200-400ms (with database overhead)
- **Cached**: <100ms (from browser cache)
- **Slow**: >1000ms (check database/network)

---

## Future Enhancements

- [ ] Add weekly/monthly aggregations
- [ ] Implement GraphQL instead of REST
- [ ] Add export functionality (CSV, PDF)
- [ ] WebSocket real-time updates
- [ ] Advanced filtering options
- [ ] Custom date range selection
- [ ] User-specific dashboard settings
- [ ] Role-based data access

---

## Resources

- **Next.js App Router**: https://nextjs.org/docs
- **Mongoose Documentation**: https://mongoosejs.com/docs
- **Clerk Authentication**: https://clerk.com/docs
- **MongoDB Aggregation**: https://docs.mongodb.com/manual/reference/operator/aggregation
- **date-fns Library**: https://date-fns.org/docs

---

## Support

For issues or questions:

1. Check the console logs in both browser and server
2. Review MongoDB queries with `.explain()`
3. Verify Clerk authentication status
4. Check `.env.local` configuration
5. Test with seeded database to isolate issues

---

**Last Updated**: December 26, 2025  
**API Version**: 1.0  
**Status**: Production Ready ✅
