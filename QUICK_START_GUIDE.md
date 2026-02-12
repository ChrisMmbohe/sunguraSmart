# Quick Start Guide - Phase 2 Interactive Dashboard

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```
The `recharts` dependency is already in `package.json` and will be installed automatically.

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: View Dashboard
Open your browser to `http://localhost:3000/dashboard`

---

## 📊 What You'll See

### Dashboard Layout (Top to Bottom)

```
┌─────────────────────────────────────────┐
│  Dashboard                    [Refresh] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚠️  Alerts (Dismissible)                 │
└─────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬────────┐
│ Card 1   │ Card 2   │ Card 3   │ Card 4 │  Metric Cards (Clickable)
└──────────┴──────────┴──────────┴────────┘

┌───────────────────────────────────────────┐
│  ⚡ Quick Actions (5 buttons)              │
└───────────────────────────────────────────┘

┌──────────────────────────┬───────────────┐
│                          │               │
│  Main Chart (Line)       │ Upcoming      │  Charts + Tasks
│  with Time Filter        │ Tasks (6)     │
│                          │               │
└──────────────────────────┴───────────────┘

┌─────────────────────────────────────────┐
│  Recent Activity Feed (6 items)          │
└─────────────────────────────────────────┘

┌──────────────────────┬──────────────────┐
│                      │                  │
│  Sales Trend         │  Breeding        │  Secondary Charts
│  (Bar Chart)         │  Distribution    │
│                      │  (Pie Chart)     │
└──────────────────────┴──────────────────┘
```

---

## ✨ Interactive Features to Try

### 1. Metric Cards (Clickable)
- **Hover**: Cards scale up (105%) with shadow
- **Click**: Navigate to related pages (/rabbits, /breeding, /finances, /health)
- **Hover on card**: See tooltip with description
- **Details section**: Shows related metrics

### 2. Interactive Chart
- **Legend**: Click any legend item to toggle that data series
- **Time Range**: Select 7d, 30d, 90d, or 1y button to filter data
- **Fullscreen**: Click fullscreen icon to expand chart
- **Tooltip**: Hover over chart to see detailed values

### 3. Quick Actions
- **5 buttons**: Record Breeding, Add Litter, Health Check, Weigh Rabbit, Record Sale
- **Each button**: Clickable to navigate to relevant section
- **Mobile**: Responsive layout changes based on screen size

### 4. Upcoming Tasks
- **Dismiss**: Click X to hide tasks you've completed
- **Priority colors**: Red (critical), Orange (high), Amber (medium), Blue (low)
- **Due dates**: Shows smart time display (Today, Tomorrow, in 2 days, etc.)
- **Navigation**: Click task to go to related page

### 5. Recent Activity
- **Click items**: Navigate to activity details
- **Remove items**: Click trash icon to hide
- **Status colors**: Green (success), Amber (warning), Red (error), Blue (info)
- **Timestamps**: Shows relative time (e.g., "2 hours ago")

### 6. Alert Banners
- **Dismissible**: Click X to close
- **Color-coded**: Different colors for different severity levels
- **Reappear on refresh**: Alerts reset when page refreshes

---

## 🎨 Customize Components

### Use Different Layouts (QuickActions)

```tsx
// Horizontal scrollable (default)
<QuickActions layout="horizontal" />

// Vertical stacked
<QuickActions layout="vertical" />

// Grid (2-4 columns)
<QuickActions layout="grid" />
```

### Change Chart Type

```tsx
// Line chart (default)
<InteractiveChart type="line" />

// Bar chart
<InteractiveChart type="bar" />

// Pie chart
<InteractiveChart type="pie" />
```

### Add Custom Stat Cards

```tsx
<StatCard
  title="Custom Metric"
  value={42}
  trend={5}
  color="success"
  icon={MyIcon}
  href="/custom-page"
  tooltipContent="Click to view details"
/>
```

---

## 📱 Responsive Design

### Mobile (< 768px)
- Single column layout
- Full-width cards
- Stacked sections
- Touch-friendly buttons (44px min height)

### Tablet (768px - 1024px)
- 2-column grids
- Side-by-side sections

### Desktop (1024px+)
- 3-4 column grids
- Multi-section layouts

**Test**: Resize your browser to see responsive behavior in action!

---

## 🌙 Dark Mode

The dashboard fully supports dark mode:

1. **System Theme**: Automatically uses your OS preference
2. **Toggle**: Use your browser's theme switcher
3. **Colors**: All elements have dark mode colors

Try it: Toggle your system theme to see colors adjust!

---

## 🔍 Data Sources

Currently using **mock data** for demonstration:

- **Stats**: 42 rabbits, 8 active breeding, 12 sales, 2 health alerts
- **Chart**: 30-day time series data with 4 metrics
- **Activities**: 5 recent events
- **Tasks**: 5 upcoming tasks with various priorities
- **Alerts**: 2 dismissible alerts

**To use real data**: Replace mock generators in `EnhancedDashboard.tsx` with API calls.

---

## 🛠️ Common Tasks

### Add a New Quick Action
1. Go to `/components/QuickActions.tsx`
2. Add to `DEFAULT_QUICK_ACTIONS` array:
```tsx
{
  id: "new",
  label: "New Action",
  icon: IconComponent,
  href: "/destination",
  color: "info"
}
```

### Add a New Task
1. Go to `/app/dashboard/enhanced-dashboard.tsx`
2. Add to `generateMockTasks()`:
```tsx
{
  id: "new",
  title: "Task Title",
  dueDate: addDays(new Date(), 5),
  priority: "high",
  type: "breeding",
  isDismissible: true
}
```

### Change Card Colors
```tsx
// Available colors:
color="primary"
color="success"
color="danger"
color="warning"
color="info"
color="purple"
```

---

## 📋 Component Props Quick Reference

### StatCard
```tsx
<StatCard
  title="string"
  value={number | string}
  trend={number}
  color="primary" | "success" | "danger" | "warning" | "info" | "purple"
  icon={Component}
  href="string"
  tooltipContent="string"
  details={[{ label: "string", value: number | string }]}
/>
```

### InteractiveChart
```tsx
<InteractiveChart
  title="string"
  description="string"
  data={[{ key: value }]}
  type="line" | "bar" | "pie"
  dataKeys={["key1", "key2"]}
  height={number}
  timeRange="7d" | "30d" | "90d" | "1y"
  onTimeRangeChange={(range) => {}}
  showExport={boolean}
  showFullscreen={boolean}
/>
```

### QuickActions
```tsx
<QuickActions
  actions={[{ id, label, icon, href, color, description }]}
  title="string"
  layout="horizontal" | "vertical" | "grid"
  showDescriptions={boolean}
/>
```

### UpcomingTasks
```tsx
<UpcomingTasks
  tasks={[{ id, title, dueDate, priority, type, href, isDismissible }]}
  maxItems={number}
  onDismiss={(id) => {}}
/>
```

---

## 🐛 Troubleshooting

### Chart Not Showing?
- Check data format: should be array of objects
- Verify dataKeys match object properties
- Check browser console for errors

### Mobile Layout Broken?
- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Resize browser window

### Dark Mode Not Working?
- Check you're using Tailwind dark: prefix
- Verify color classes are defined
- Test with theme toggle

### Recharts Error?
```
npm install recharts@^2.10.0
npm run build
npm run dev
```

---

## 📚 Documentation

- **INTERACTIVE_DASHBOARD_GUIDE.md** - Full technical guide
- **COMPONENT_REFERENCE.md** - API reference for all components
- **PHASE2_IMPLEMENTATION_CHECKLIST.md** - Testing checklist
- **PHASE2_PROJECT_SUMMARY.md** - Project overview

---

## 🚀 Next Steps

1. **Test the dashboard** - Click around, try all features
2. **Test on mobile** - Resize browser or use DevTools
3. **Try dark mode** - Toggle your system theme
4. **Review code** - Check component implementations
5. **Integrate APIs** - Replace mock data with real data
6. **Deploy** - Run `npm run build && npm run start`

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Install & Setup | 5 min |
| View Dashboard | 2 min |
| Test All Features | 30 min |
| Test Responsiveness | 15 min |
| Review Documentation | 10 min |
| **Total** | **~62 min** |

---

## 💡 Pro Tips

1. **Keyboard Navigation**: Use Tab to navigate, Enter to activate
2. **Dismissible Items**: Dismissed items reset on page refresh (demo only)
3. **Mobile Testing**: Use Chrome DevTools device emulation
4. **Dark Mode**: Check WCAG color contrast in dark mode
5. **Performance**: Open DevTools Performance tab to monitor

---

## 📞 Questions?

Refer to:
1. Component prop interfaces in source files
2. INTERACTIVE_DASHBOARD_GUIDE.md for details
3. COMPONENT_REFERENCE.md for examples
4. Inline code comments in component files

---

**Status**: ✅ Ready to use!
**Happy Building!** 🎉
