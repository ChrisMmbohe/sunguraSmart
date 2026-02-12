# Interactive Dashboard Components - Quick Reference

## Component Overview

| Component | Type | Lines | Purpose | New/Enhanced |
|-----------|------|-------|---------|-------------|
| StatCard | Metric Card | 180 | Interactive clickable metrics with hover effects | Enhanced |
| InteractiveChart | Data Viz | 280 | Recharts-based line/bar/pie charts | New |
| QuickActions | Action Menu | 120 | Fast-access task buttons | New |
| UpcomingTasks | Task List | 240 | Priority-based task management | New |
| RecentActivity | Activity Feed | ~250 | Farm event history with removal | Enhanced |
| EnhancedDashboard | Orchestrator | 410 | Main dashboard component | New |

---

## StatCard Component

**File**: `/components/StatCard.tsx`
**Purpose**: Display key metric with interactivity

### Props
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  color?: "primary" | "success" | "danger" | "warning" | "info" | "purple";
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  tooltipContent?: string;
  details?: Array<{ label: string; value: string | number }>;
}
```

### Usage
```tsx
<StatCard
  title="Total Rabbits"
  value={42}
  unit="rabbits"
  trend={5}
  color="primary"
  icon={Users}
  href="/rabbits"
  tooltipContent="View all rabbits"
  details={[
    { label: "Does", value: 18 },
    { label: "Bucks", value: 14 }
  ]}
/>
```

### Features
- ✅ Hover scaling (105%)
- ✅ Click navigation (href)
- ✅ Tooltips (Radix UI)
- ✅ Trend indicators (↑↓)
- ✅ Details breakdown
- ✅ Keyboard accessible
- ✅ Dark mode support

---

## InteractiveChart Component

**File**: `/components/InteractiveChart.tsx`
**Purpose**: Interactive data visualization using Recharts

### Props
```typescript
interface InteractiveChartProps {
  title: string;
  description: string;
  data: Array<Record<string, unknown>>;
  type: "line" | "bar" | "pie";
  dataKeys: string[];
  colors?: string[];
  height?: number;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  showExport?: boolean;
  showFullscreen?: boolean;
  tooltip?: { enabled?: boolean };
  legend?: { enabled?: boolean };
  isLoading?: boolean;
}
```

### Usage
```tsx
<InteractiveChart
  title="Farm Overview"
  description="30-day metrics"
  data={chartData}
  type="line"
  dataKeys={["rabbits", "sales", "vaccinations"]}
  height={400}
  timeRange="30d"
  onTimeRangeChange={(range) => handleRangeChange(range)}
  showExport={true}
  showFullscreen={true}
/>
```

### Features
- ✅ Three chart types (line, bar, pie)
- ✅ Legend toggling (click series)
- ✅ Time range selector (7d/30d/90d/1y)
- ✅ Fullscreen mode
- ✅ Export button (stub)
- ✅ Custom tooltips
- ✅ Responsive
- ✅ Dark mode

### Chart Types
- **Line**: Time series trends
- **Bar**: Category comparisons
- **Pie**: Part-to-whole ratios

### Data Format (Line/Bar)
```typescript
[
  { date: "2024-01-01", rabbits: 45, sales: 3, vaccinations: 1 },
  { date: "2024-01-02", rabbits: 46, sales: 2, vaccinations: 2 },
  // ...
]
```

### Data Format (Pie)
```typescript
[
  { name: "Active", value: 8 },
  { name: "Scheduled", value: 3 },
  // ...
]
```

---

## QuickActions Component

**File**: `/components/QuickActions.tsx`
**Purpose**: Fast-access buttons for common tasks

### Props
```typescript
interface QuickActionsProps {
  actions: QuickActionItem[];
  title?: string;
  layout?: "horizontal" | "vertical" | "grid";
  showDescriptions?: boolean;
}

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  href?: string;
  onClick?: () => void;
  color?: "default" | "success" | "danger" | "warning" | "info";
  description?: string;
}
```

### Usage
```tsx
<QuickActions
  actions={[
    {
      id: "1",
      label: "Record Breeding",
      icon: Heart,
      href: "/breeding",
      color: "info",
      description: "Add new breeding record"
    },
    // ...
  ]}
  title="Quick Actions"
  layout="grid"
  showDescriptions={false}
/>

// Or use presets:
<QuickActions
  actions={DEFAULT_QUICK_ACTIONS}
  layout="grid"
/>
```

### Default Actions
```typescript
DEFAULT_QUICK_ACTIONS = [
  { id: "1", label: "Record Breeding", icon: Heart, href: "/breeding", color: "info" },
  { id: "2", label: "Add Litter", icon: Baby, href: "/litters", color: "success" },
  { id: "3", label: "Health Check", icon: Stethoscope, href: "/health", color: "warning" },
  { id: "4", label: "Weigh Rabbit", icon: Weight, href: "/rabbits", color: "default" },
  { id: "5", label: "Record Sale", icon: DollarSign, href: "/finances", color: "success" }
]
```

### Features
- ✅ 3 layouts: horizontal, vertical, grid
- ✅ 5 color variants
- ✅ Icon + label support
- ✅ Link navigation (href)
- ✅ Click handlers (onClick)
- ✅ Optional descriptions
- ✅ Responsive
- ✅ Mobile touch-friendly

### Layouts
- **Horizontal**: Scrollable row, takes full width
- **Vertical**: Stacked vertically
- **Grid**: 2-4 columns responsive grid

---

## UpcomingTasks Component

**File**: `/components/UpcomingTasks.tsx`
**Purpose**: Task management with priority and due date tracking

### Props
```typescript
interface UpcomingTasksProps {
  tasks: UpcomingTask[];
  isLoading?: boolean;
  maxItems?: number;
  onDismiss?: (taskId: string) => void;
}

interface UpcomingTask {
  id: string;
  title: string;
  description?: string;
  dueDate: Date | string;
  priority: "low" | "medium" | "high" | "critical";
  type: "kindling" | "weaning" | "vaccination" | "health" | "breeding" | "nest" | "other";
  href?: string;
  isDismissible?: boolean;
}
```

### Usage
```tsx
const tasks = [
  {
    id: "t1",
    title: "Weaning Day - Litter #5",
    description: "Separate kits from Luna",
    dueDate: new Date(2024, 0, 15),
    priority: "high",
    type: "weaning",
    href: "/litters",
    isDismissible: true
  },
  // ...
];

<UpcomingTasks
  tasks={tasks}
  isLoading={false}
  maxItems={6}
  onDismiss={(taskId) => handleDismiss(taskId)}
/>
```

### Priority Colors
- **Critical**: Red (#ef4444)
- **High**: Orange (#f97316)
- **Medium**: Amber (#eab308)
- **Low**: Blue (#3b82f6)

### Task Type Icons
- 🤰 Kindling
- 🍼 Weaning
- 💉 Vaccination
- 🏥 Health
- ❤️ Breeding
- 🪶 Nest
- 📋 Other

### Due Date Status
- **Overdue**: Red, past date
- **Today**: Red, special styling
- **Tomorrow**: Amber, special styling
- **Soon**: Amber, within 7 days
- **Later**: Default, more than 7 days

### Features
- ✅ Priority levels (4 colors)
- ✅ Task types (7 types with emojis)
- ✅ Due date calculation
- ✅ Dismissible tasks
- ✅ Navigation links
- ✅ View all button
- ✅ Loading skeletons
- ✅ Relative time display

---

## RecentActivity Component

**File**: `/components/RecentActivity.tsx`
**Purpose**: Display recent farm events

### Props
```typescript
interface RecentActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  maxItems?: number;
  onActivityClick?: (activity: ActivityItem) => void;
  onActivityRemove?: (activityId: string) => void;
  showRemove?: boolean;
  className?: string;
}

interface ActivityItem {
  id: string;
  type: "breeding" | "sale" | "health" | "litter" | "alert" | "milestone" | "weight";
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: "success" | "warning" | "alert" | "info";
  href?: string;
}
```

### Usage
```tsx
<RecentActivity
  activities={activities}
  isLoading={false}
  maxItems={5}
  onActivityClick={(activity) => navigate(activity.href)}
  onActivityRemove={(id) => dismissActivity(id)}
  showRemove={true}
/>
```

### Activity Types
- 🔴 Breeding
- 👶 Litter
- 💰 Sale
- ⚠️ Health
- 🚨 Alert
- ✅ Milestone
- ⚖️ Weight

### Status Colors
- **Success**: Green background
- **Warning**: Amber background
- **Alert**: Red background
- **Info**: Blue background

### Features
- ✅ Type-based icons
- ✅ Status color coding
- ✅ Click to navigate (href)
- ✅ Remove individual items
- ✅ Relative timestamps
- ✅ Descriptions support
- ✅ Loading skeletons
- ✅ View all button

---

## EnhancedDashboard Component

**File**: `/app/dashboard/enhanced-dashboard.tsx`
**Purpose**: Main dashboard orchestrator

### Props
```typescript
interface EnhancedDashboardProps {
  initialData?: DashboardData;
  userId?: string;
}

interface DashboardData {
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
    type: "error" | "warning" | "success";
    title: string;
    description: string;
    dismissible?: boolean;
  }>;
}
```

### Usage
```tsx
<EnhancedDashboard />

// Or with initial data:
<EnhancedDashboard
  initialData={dashboardData}
  userId="user123"
/>
```

### Sections
1. **Alerts** - Dismissible alert banners
2. **Metric Cards** - 4 interactive stat cards
3. **Quick Actions** - Flexible action buttons
4. **Main Chart + Tasks** - Side-by-side layout
5. **Recent Activity** - Activity feed
6. **Secondary Charts** - Sales trend + breeding distribution

### Features
- ✅ Mock data generation
- ✅ State management (dismissed items)
- ✅ Time range selection
- ✅ Loading states
- ✅ Responsive layout
- ✅ All components integrated

---

## Implementation Examples

### Basic Dashboard
```tsx
import { EnhancedDashboard } from "./enhanced-dashboard";

export default function DashboardPage() {
  return <EnhancedDashboard />;
}
```

### Custom StatCard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    title="Total Rabbits"
    value={42}
    icon={Users}
    href="/rabbits"
  />
  <StatCard
    title="Sales This Month"
    value={12}
    icon={TrendingUp}
    href="/finances"
    color="success"
  />
  {/* ... more cards */}
</div>
```

### Custom Chart
```tsx
<InteractiveChart
  title="Population Trend"
  description="30-day overview"
  data={monthlyData}
  type="line"
  dataKeys={["population", "newKits", "sales"]}
  height={400}
  showFullscreen={true}
/>
```

### Custom Task List
```tsx
<UpcomingTasks
  tasks={priorityTasks}
  maxItems={10}
  onDismiss={(id) => {
    setDismissed(new Set([...dismissed, id]));
  }}
/>
```

---

## Styling & Theming

### Color Classes
```css
/* Primary */
.bg-primary .text-primary .border-primary
.dark:bg-primary

/* Success */
.bg-green-600 .text-green-600

/* Warning */
.bg-amber-600 .text-amber-600

/* Danger */
.bg-red-600 .text-red-600

/* Info */
.bg-blue-600 .text-blue-600
```

### Responsive Classes
```css
/* Mobile first */
.grid-cols-1
.md:grid-cols-2
.lg:grid-cols-4
.xl:grid-cols-5
```

### Hover Effects
```css
/* StatCard */
.hover:scale-105
.hover:shadow-lg

/* General */
.hover:bg-muted
.hover:border-border
```

---

## Performance Tips

1. **Memoize Lists**: Use React.memo for repeated components
2. **Lazy Load**: Use dynamic imports for secondary charts
3. **Debounce**: Time range changes on charts
4. **Virtual Scroll**: For activity lists > 100 items
5. **Cache Data**: Use useMemo for expensive calculations

---

## Troubleshooting

### Chart Not Displaying
- Check data format matches interface
- Verify dataKeys exist in data array
- Ensure numeric values in data

### Mobile Layout Broken
- Check responsive classes applied
- Test with DevTools device emulation
- Verify flexbox/grid working

### Keyboard Navigation Not Working
- Check tabIndex attributes
- Verify onKeyDown handlers
- Test with keyboard only

### Dark Mode Issues
- Check dark: prefixed classes
- Verify color contrast (WCAG AA)
- Test in dark mode toggle

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | Latest 2 | ✅ Full |
| Firefox | Latest 2 | ✅ Full |
| Safari | Latest 2 | ✅ Full |
| Edge | Latest 2 | ✅ Full |
| Mobile Chrome | Latest | ✅ Full |
| Mobile Safari | Latest | ✅ Full |

---

## Dependencies

```json
{
  "react": "^19.2.0",
  "next": "^16.0.1",
  "recharts": "^2.10.0",
  "lucide-react": "^0.553.0",
  "date-fns": "^4.1.0",
  "@radix-ui/react-tooltip": "^latest"
}
```

---

**Last Updated**: January 2024
**Status**: ✅ Complete
