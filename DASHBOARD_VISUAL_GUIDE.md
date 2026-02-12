# Dashboard Layout & Visual Structure

## 📐 Dashboard Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                      SITE HEADER                                 │
├──────────┬─────────────────────────────────────────────────────┤
│          │ Dashboard                                     [🔄]    │
│ SIDEBAR  │ Welcome back! Here's your farm overview.             │
│          │                                                       │
├──────────┼─────────────────────────────────────────────────────┤
│          │                                                       │
│          │  ⚠️  ALERT BANNER SECTION (Conditional)            │
│          │  ├─ Health Alert: X rabbit(s) need attention        │
│          │  ├─ Cage Alert: Y% full (if > 90%)                 │
│          │  └─ Mortality Alert: Z% (if > 5%)                  │
│          │                                                       │
├──────────┼─────────────────────────────────────────────────────┤
│          │                                                       │
│          │  KEY METRICS GRID (4 columns on desktop)            │
│          │  ┌──────────┬──────────┬──────────┬──────────┐     │
│          │  │ Rabbits  │ Breeding │ Revenue  │ Health   │     │
│          │  │    150   │  87.5%   │ $1,250   │    2     │     │
│          │  ├──────────┼──────────┼──────────┼──────────┤     │
│          │  │ Litters  │ Feed     │ Occupancy│ Mortality│     │
│          │  │    3     │ 1.85 kg  │   72%    │  3.2%    │     │
│          │  └──────────┴──────────┴──────────┴──────────┘     │
│          │                                                       │
├──────────┼─────────────────────────────────────────────────────┤
│          │  ─────────────────────────────────────              │
│          │                                                       │
│          │  CHARTS SECTION (2 columns on desktop)              │
│          │  ┌──────────────────────┬──────────────────────┐   │
│          │  │ Population Trend     │ Financial Summary    │   │
│          │  │                      │                      │   │
│          │  │  (Line Chart SVG)    │ Income: $1,250  ▼   │   │
│          │  │  (300px height)      │ Expenses: $750  ▼   │   │
│          │  │                      │ ────────────────    │   │
│          │  │                      │ Profit: $500    ▲   │   │
│          │  └──────────────────────┴──────────────────────┘   │
│          │                                                       │
├──────────┼─────────────────────────────────────────────────────┤
│          │  ─────────────────────────────────────              │
│          │                                                       │
│          │  ACTIVITY & PERFORMANCE (3 columns on desktop)     │
│          │  ┌─────────────────────────────┬──────────────────┐│
│          │  │ Recent Activity (6 items)   │ Metrics (4 bars) ││
│          │  │                             │                  ││
│          │  │ ❤️  Breeding scheduled     │ Breeding: 87.5%  ││
│          │  │ 👶 Litter born (8 kits)    │ ████░░░░         ││
│          │  │ 💰 Rabbit sold ($50)       │                  ││
│          │  │ ⚠️  Health record: Sore hock│ Survival: 94.2%  ││
│          │  │ ✓️  All metrics updated     │ ███████░         ││
│          │  │ → View all activity        │                  ││
│          │  │                             │ Occupancy: 72%   ││
│          │  │ Last update: 2 hours ago   │ █████░░░         ││
│          │  │                             │                  ││
│          │  │                             │ Efficiency: 92.7%││
│          │  │                             │ ███████░░        ││
│          │  └─────────────────────────────┴──────────────────┘│
│          │                                                       │
│          │  Dashboard data updates automatically. Last refresh: │
│          │  10:45 AM                                           │
│          │                                                       │
└──────────┴─────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Layout (Single Column)

```
┌────────────────────────────────┐
│         MOBILE HEADER           │
│ Dashboard         [🔄]          │
├────────────────────────────────┤
│                                 │
│  ⚠️  ALERTS (stacked)          │
│  ├─ Health Alert               │
│  └─ Cage Alert                 │
│                                 │
├────────────────────────────────┤
│  METRICS (1 column)             │
│  ┌────────────────────────────┐ │
│  │ Rabbits: 150               │ │
│  │ 80 active • 20 kits        │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ Breeding: 87.5%            │ │
│  │ ↑ 94.2% survival           │ │
│  └────────────────────────────┘ │
│  [More cards stacked...]        │
│                                 │
├────────────────────────────────┤
│  CHART (Full width)             │
│  ┌────────────────────────────┐ │
│  │ Population Trend (smaller) │ │
│  └────────────────────────────┘ │
│                                 │
├────────────────────────────────┤
│  RECENT ACTIVITY (scrollable)   │
│  ┌────────────────────────────┐ │
│  │ ❤️ Breeding scheduled      │ │
│  │ 2 hours ago                │ │
│  └────────────────────────────┘ │
│  [More items...]               │
│                                 │
└────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```
<Dashboard> (page.tsx)
├── <SidebarProvider>
│   ├── <AppSidebar />
│   └── <SidebarInset>
│       ├── <SiteHeader />
│       └── <main>
│           ├── <HeaderSection>
│           │   ├── <h1>Dashboard</h1>
│           │   └── <RefreshButton />
│           │
│           ├── <AlertSection>
│           │   ├── <AlertBanner type="warning" /> (conditional)
│           │   ├── <AlertBanner type="error" /> (conditional)
│           │   └── <AlertBanner type="error" /> (conditional)
│           │
│           ├── <MetricsGrid>
│           │   ├── <StatCard> Total Rabbits
│           │   ├── <StatCard> Breeding Success
│           │   ├── <StatCard> Revenue
│           │   ├── <StatCard> Health Alerts
│           │   ├── <StatCard> Active Litters
│           │   ├── <StatCard> Feed Efficiency
│           │   ├── <StatCard> Cage Occupancy
│           │   └── <StatCard> Mortality Rate
│           │
│           ├── <Separator />
│           │
│           ├── <ChartsSection>
│           │   ├── <DashboardChart> Population Trend
│           │   └── <FinancialPanel>
│           │       ├── Income Card
│           │       ├── Expenses Card
│           │       └── Profit Card
│           │
│           ├── <Separator />
│           │
│           ├── <ActivitySection>
│           │   ├── <RecentActivity> 6 items
│           │   └── <PerformanceMetrics>
│           │       ├── Breeding Progress Bar
│           │       ├── Survival Progress Bar
│           │       ├── Occupancy Progress Bar
│           │       └── Efficiency Progress Bar
│           │
│           └── <Footer>
│               └── Last refresh timestamp
```

---

## 🎯 StatCard Variants

```
COLOR: primary          COLOR: success
┌──────────────────┐   ┌──────────────────┐
│ Total Rabbits [🐰]   │ Breeding Success [⬆]
│      150         │   │      87.5%       │
│ 80 active • ...  │   │ ↑ 94% survival   │
└──────────────────┘   └──────────────────┘

COLOR: danger           COLOR: warning
┌──────────────────┐   ┌──────────────────┐
│ Health Alerts [⚠]    │ Feed Efficiency [🍽]
│        2         │   │      1.85        │
│ Rabbits need attention │ kg feed/kg gain
└──────────────────┘   └──────────────────┘

COLOR: info            COLOR: purple
┌──────────────────┐   ┌──────────────────┐
│ Cage Occupancy [🏠]  │ Active Litters [👶]
│       72%        │   │        3         │
│ 18 slots free    │   │ 8 kits born      │
└──────────────────┘   └──────────────────┘
```

---

## 📊 Alert Banner States

### Error Alert (Red)
```
┌───────────────────────────────────────┐
│ 🚨 High Mortality Rate              [×]│
│ Your mortality rate is 7.5% (above    │
│ 5% threshold). Investigate potential  │
│ health issues.                         │
│                    [View Details] [Dismiss]
└───────────────────────────────────────┘
```

### Warning Alert (Amber)
```
┌───────────────────────────────────────┐
│ ⚠️  Cage Capacity Alert              [×]│
│ Your cages are 95% full. Consider     │
│ expanding capacity.                    │
│                    [View Management] [Dismiss]
└───────────────────────────────────────┘
```

### Success Alert (Green)
```
┌───────────────────────────────────────┐
│ ✓ All Metrics Updated Successfully   [×]│
│ Dashboard data has been refreshed.     │
└───────────────────────────────────────┘
```

### Info Alert (Blue)
```
┌───────────────────────────────────────┐
│ ℹ️  Breeding Season Upcoming          [×]│
│ Optimal breeding conditions in 2 weeks.│
│ Prepare your does.                     │
│                    [Learn More] [Dismiss]
└───────────────────────────────────────┘
```

---

## 📈 Chart Visual Layout

```
Population Trend
─────────────────────────────────────────────
150 │                    ╱╲
    │                ╱╲╱  ╲╱╲
120 │            ╱╲╱          ╲╱
    │        ╱╲╱
100 │    ╱╲╱
    │  ╱
    └─────────────────────────────────────
      Jan 1  Jan 2  Jan 3  Jan 4  Jan 5

Legend:
■ Total Population  ■ Active Rabbits  ■ Kits
```

---

## 🎨 Color Scheme

### Light Mode
```
Background:     White (#FFFFFF)
Card:           Light Gray (#FAFAFA)
Text Primary:   Dark Gray (#1A1A1A)
Text Secondary: Medium Gray (#666666)

Metrics:
├── Primary:   Blue (#0ea5e9)
├── Success:   Green (#10b981)
├── Danger:    Red (#ef4444)
├── Warning:   Amber (#f59e0b)
├── Info:      Cyan (#06b6d4)
└── Purple:    Purple (#a855f7)
```

### Dark Mode
```
Background:     Dark Gray (#1a1a1a)
Card:           Very Dark (#2d2d2d)
Text Primary:   Light Gray (#f5f5f5)
Text Secondary: Medium Gray (#a0a0a0)

Metrics:
├── Primary:   Light Blue (#38bdf8)
├── Success:   Light Green (#4ade80)
├── Danger:    Light Red (#f87171)
├── Warning:   Light Amber (#fbbf24)
├── Info:      Light Cyan (#22d3ee)
└── Purple:    Light Purple (#d8b4fe)
```

---

## 📲 Responsive Breakpoints

```
Mobile (< 768px)
└── Single column layout
    ├── 1 metric card per row
    ├── Full-width charts
    └── Stacked sections

Tablet (768px - 1024px)
└── Two column layout
    ├── 2 metric cards per row
    ├── Side-by-side charts
    └── Horizontal sections

Desktop (> 1024px)
└── Multi-column layout
    ├── 4 metric cards per row
    ├── 2-3 column sections
    └── Optimized spacing

Ultra-wide (> 1440px)
└── Enhanced density
    ├── More metrics visible
    ├── Larger charts
    └── Additional info panels
```

---

## 🔄 Data Update Flow

```
User visits /dashboard
        ↓
┌───────────────────┐
│ Loading state     │
│ ├─ Skeleton cards │
│ └─ Spinner icon   │
└───────────────────┘
        ↓
┌──────────────────────────┐
│ Parallel API calls       │
│ ├─ GET /api/stats        │
│ └─ GET /api/activity     │
└──────────────────────────┘
        ↓
┌─────────────────────────┐
│ Data received           │
│ ├─ Update StatCards     │
│ ├─ Populate charts      │
│ ├─ Show activities      │
│ └─ Display alerts       │
└─────────────────────────┘
        ↓
┌──────────────────────┐
│ User can interact    │
│ ├─ Click metrics     │
│ ├─ View trends       │
│ ├─ Dismiss alerts    │
│ └─ Refresh data      │
└──────────────────────┘
```

---

## 🎯 Interactive Elements

```
CLICKABLE AREAS:
├── StatCard
│   └── Drill-down to detailed view
├── DashboardChart
│   └── Show/hide data series (future)
├── RecentActivity Item
│   └── Navigate to event details
├── AlertBanner Action
│   └── Navigate to related page
├── Refresh Button
│   └── Update all metrics
└── "View all activity"
    └── Navigate to activity page

HOVER EFFECTS:
├── StatCard
│   └── Subtle shadow increase
├── RecentActivity Item
│   └── Background highlight
├── Alert Action Button
│   └── Color intensity change
└── Progress Bars
    └── Tooltip display (future)
```

---

## 📊 Data Hierarchy

```
HIGHEST PRIORITY
├── Critical Alerts
│   ├── High Mortality Rate
│   ├── Health Issues
│   └── Capacity Problems
│
MEDIUM PRIORITY
├── Key Metrics
│   ├── Population
│   ├── Revenue
│   └── Breeding Rate
│
DETAILED INFO
├── Charts
│   └── Trend Analysis
│
├── Activity Feed
│   └── Event History
│
└── Performance Metrics
    └── Progress Indicators
```

---

## 🎨 Animation & Transitions

```
Loading States:
├── Skeleton shimmer (200ms)
├── Fade-in on load (300ms)
└── Pulse on update (500ms)

Interactions:
├── Card hover (150ms)
├── Button press (100ms)
└── Alert dismiss (200ms)

Transitions:
├── Color changes (200ms)
├── Size adjustments (250ms)
└── Position shifts (300ms)
```

---

## ✨ Accessibility Features

```
VISUAL:
├── Color-blind safe palette
├── High contrast ratio (4.5:1)
├── Large touch targets (40px+)
└── Clear focus indicators

KEYBOARD:
├── Tab navigation order
├── Enter/Space activation
├── Escape to close modals
└── Arrow keys for navigation

SCREEN READER:
├── ARIA labels
├── Role attributes
├── Live regions for updates
└── Semantic HTML structure
```

---

*Visual documentation created: December 26, 2025*
*Last updated: Version 1.0.0*
