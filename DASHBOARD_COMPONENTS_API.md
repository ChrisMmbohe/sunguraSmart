# Dashboard Components - Quick Reference Guide

## 📚 Component API Documentation

### StatCard

A reusable metric card component for displaying KPIs with optional trends and subtexts.

#### Props
```typescript
interface StatCardProps {
  title: string;              // Card title/label
  value: string | number;     // Main metric value
  icon: React.ReactNode;      // Icon element
  isLoading?: boolean;        // Show skeleton loading state
  trend?: {
    value: string;            // Trend text (e.g., "+5%")
    positive: boolean;        // Color indicator (green/red)
  };
  subText?: string;           // Secondary text below value
  color?: "primary" | "success" | "danger" | "warning" | "info" | "purple";
  onClick?: () => void;       // Click handler for drill-down
  className?: string;         // Additional Tailwind classes
}
```

#### Color Variants
- **primary**: Blue (default, informational metrics)
- **success**: Green (positive indicators, achievements)
- **danger**: Red (critical alerts, negative values)
- **warning**: Amber (cautions, threshold alerts)
- **info**: Cyan (supplementary information)
- **purple**: Purple (special categories like litters)

#### Example Usage
```tsx
import { StatCard } from "@/components/StatCard";
import { Rabbit } from "lucide-react";

export function MyDashboard() {
  return (
    <StatCard
      title="Total Rabbits"
      value={150}
      icon={<Rabbit className="h-5 w-5" />}
      isLoading={false}
      color="primary"
      subText="80 active • 20 kits • 5 quarantined"
      trend={{ value: "+5 this month", positive: true }}
      onClick={() => navigate("/rabbits")}
    />
  );
}
```

---

### DashboardChart

A flexible SVG-based chart component for visualizing trends without external dependencies.

#### Props
```typescript
interface DashboardChartProps {
  title: string;              // Chart title
  data: DataPoint[];          // Array of data points
  config: ChartConfig[];      // Line configurations
  isLoading?: boolean;        // Loading state
  height?: number;            // Chart height in pixels (default: 300)
  type?: "line" | "bar" | "area"; // Chart type (currently line implemented)
  showLegend?: boolean;       // Show legend (default: true)
  showGrid?: boolean;         // Show grid lines (default: true)
  description?: string;       // Subtitle text
  className?: string;         // Additional Tailwind classes
}

interface DataPoint {
  name: string;               // X-axis label
  value: number;              // Primary value
  [key: string]: string | number; // Additional data keys
}

interface ChartConfig {
  name: string;               // Legend label
  color: string;              // Hex color
  key: string;                // Data key to plot
}
```

#### Example Usage
```tsx
import { DashboardChart } from "@/components/DashboardChart";

const data = [
  { name: "Jan 1", Population: 100, Active: 85, Kits: 15 },
  { name: "Jan 2", Population: 102, Active: 87, Kits: 15 },
  { name: "Jan 3", Population: 105, Active: 88, Kits: 17 },
];

const config = [
  { name: "Total Population", key: "Population", color: "#0ea5e9" },
  { name: "Active Rabbits", key: "Active", color: "#10b981" },
  { name: "Kits", key: "Kits", color: "#a855f7" },
];

export function PopulationTrendChart() {
  return (
    <DashboardChart
      title="Population Trend"
      data={data}
      config={config}
      height={300}
      description="7-day population overview"
    />
  );
}
```

---

### RecentActivity

A scrollable activity feed showing recent events with timestamps and status indicators.

#### Props
```typescript
interface ActivityItem {
  id: string;
  type: "breeding" | "sale" | "health" | "litter" | "alert" | "milestone";
  title: string;              // Main event title
  description?: string;       // Event details
  timestamp: Date | string;   // Event time
  status?: "success" | "warning" | "alert" | "info";
  relatedId?: string;         // ID for drill-down navigation
  relatedType?: "rabbit" | "litter" | "breeding";
  metadata?: Record<string, unknown>;
}

interface RecentActivityProps {
  activities: ActivityItem[];           // Array of activities
  isLoading?: boolean;                  // Loading state
  maxItems?: number;                    // Max items to display (default: 5)
  onActivityClick?: (activity: ActivityItem) => void; // Click handler
  className?: string;                   // Additional Tailwind classes
}
```

#### Activity Types & Icons
- **breeding**: Heart icon - breeding events
- **litter**: Baby icon - litter births
- **sale**: DollarSign icon - sales
- **health**: AlertCircle icon - health records
- **alert**: AlertTriangle icon - system alerts
- **milestone**: CheckCircle icon - achievements

#### Example Usage
```tsx
import { RecentActivity } from "@/components/RecentActivity";

const activities = [
  {
    id: "1",
    type: "litter",
    title: "Litter born",
    description: "8 kits from Fluffy",
    timestamp: new Date(),
    status: "success",
  },
  {
    id: "2",
    type: "sale",
    title: "Rabbit sold",
    description: "$50 from Hop",
    timestamp: new Date(Date.now() - 3600000),
    status: "success",
  },
];

export function ActivityFeed() {
  return (
    <RecentActivity
      activities={activities}
      maxItems={6}
      onActivityClick={(activity) => console.log(activity)}
    />
  );
}
```

---

### AlertBanner

A prominent notification component for critical alerts and messages.

#### Props
```typescript
type AlertType = "error" | "warning" | "success" | "info";

interface AlertBannerProps {
  type: AlertType;            // Alert severity
  title: string;              // Alert headline
  description?: string;       // Detailed message
  dismissible?: boolean;      // Allow dismissal (default: true)
  onDismiss?: () => void;    // Dismiss handler
  actionLabel?: string;       // Action button label
  onAction?: () => void;      // Action button handler
  className?: string;         // Additional Tailwind classes
}
```

#### Alert Types
- **error**: Red - Critical issues requiring immediate action
- **warning**: Amber - Important cautions
- **success**: Green - Positive confirmations
- **info**: Blue - Informational messages

#### Example Usage
```tsx
import { AlertBanner } from "@/components/AlertBanner";

export function DashboardAlerts() {
  return (
    <div className="space-y-3">
      <AlertBanner
        type="warning"
        title="High Mortality Rate"
        description="Your mortality rate is 7.5% (above 5% threshold)"
        actionLabel="View Details"
        onAction={() => navigate("/health")}
      />
      
      <AlertBanner
        type="error"
        title="Cage Overcrowding"
        description="Cage occupancy is at 95%. Consider expanding capacity."
        dismissible
      />
    </div>
  );
}
```

---

## 🎨 Color Palette Reference

### Tailwind CSS Color Usage

```typescript
// Background colors
bg-card              // Card background
bg-muted             // Secondary background
bg-muted/50          // Semi-transparent muted

// Text colors
text-card-foreground // Main text on cards
text-muted-foreground // Secondary/helper text
text-destructive     // Error/danger text

// Status colors
text-green-600       // Success/positive
text-red-600         // Error/danger
text-amber-600       // Warning
text-blue-600        // Info/primary
text-purple-600      // Special/highlight

// Dark mode
dark:bg-green-950    // Dark green background
dark:text-green-400  // Dark green text
```

---

## 📱 Responsive Breakpoints

The dashboard uses Tailwind CSS responsive prefixes:

```typescript
// Mobile first (default)
className="grid-cols-1"  // 1 column on mobile

// Tablet (md:)
className="md:grid-cols-2"  // 2 columns at 768px

// Desktop (lg:)
className="lg:grid-cols-4"  // 4 columns at 1024px

// Large screens (xl:)
className="xl:grid-cols-5"  // 5 columns at 1280px
```

---

## 🔄 Data Fetching Pattern

### Recommended Dashboard Data Flow

```typescript
"use client"; // Client component for interactivity

import { useEffect, useState } from "react";

interface DashboardData {
  stats: APIStats;
  activities: ActivityItem[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/dashboard/activity"),
      ]);

      if (!statsRes.ok || !activityRes.ok) throw new Error("Fetch failed");

      const stats = await statsRes.json();
      const activities = await activityRes.json();

      setData({ stats, activities });
      setError(null);
    } catch (err) {
      setError("Failed to load dashboard");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) return <AlertBanner type="error" title="Error" description={error} />;

  return (
    <div className="space-y-6">
      <StatCard isLoading={isLoading} {...data?.stats} />
      <RecentActivity isLoading={isLoading} activities={data?.activities || []} />
    </div>
  );
}
```

---

## 🎯 Integration Checklist

- [ ] Import components in dashboard page
- [ ] Ensure TypeScript types match API responses
- [ ] Add error boundaries for production
- [ ] Test responsive design on mobile devices
- [ ] Verify dark mode compatibility
- [ ] Check accessibility with screen readers
- [ ] Optimize image assets if using custom icons
- [ ] Set up error logging/monitoring
- [ ] Configure caching strategy for stats API
- [ ] Set up refresh interval or WebSocket updates (optional)

---

## 🐛 Troubleshooting

### StatCard not displaying colors
- Ensure color prop is one of: `primary`, `success`, `danger`, `warning`, `info`, `purple`
- Check Tailwind CSS is properly configured

### Chart data not rendering
- Verify DataPoint objects have `name` property
- Check config array matches keys in data points
- Ensure numeric values are actual numbers, not strings

### Activity timestamps showing wrong time
- Ensure timestamp is ISO string or Date object
- Check user's timezone settings
- Verify date-fns is installed

### Alert banner not showing
- Check `isVisible` state isn't false
- Ensure AlertBanner is not outside viewport
- Verify type prop is valid

---

## 📖 Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [date-fns Documentation](https://date-fns.org)
