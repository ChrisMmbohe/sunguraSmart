# Schedule Page - Developer Quick Reference

## File Locations
```
📁 /app/schedule/
   ├── page.tsx (Main page - Server component)
   └── schedule-page-client.tsx (State management - Client component)

📁 /components/
   ├── ScheduleCalendar.tsx (Calendar view)
   ├── ScheduleTaskList.tsx (List view)
   └── ScheduleTaskCard.tsx (Task card - used by both views)
```

## Quick Start for Integration

### 1. Connect to Real API
**File**: `/app/schedule/page.tsx`

Replace the mock data section with an API call:

```typescript
// Replace lines 125-127
export default async function SchedulePage() {
  // Old (mock):
  // const schedules = mockSchedules
  
  // New (real API):
  const schedules = await fetch('/api/schedule').then(r => r.json())
  
  return (...)
}
```

### 2. Add API Route
Create `/app/api/schedule/route.ts`:

```typescript
import { Schedule } from '@/database/schedule.model'

export async function GET() {
  const schedules = await Schedule.find().lean()
  return Response.json(schedules)
}

export async function PATCH(req: Request) {
  const { scheduleId, is_completed } = await req.json()
  await Schedule.findByIdAndUpdate(scheduleId, { is_completed })
  return Response.json({ success: true })
}
```

### 3. Enable Task Completion Updates
**File**: `/app/schedule/schedule-page-client.tsx`

Modify the `handleToggleComplete` function:

```typescript
const handleToggleComplete = async (scheduleId: string) => {
  // Optimistic update
  setSchedules((prev) =>
    prev.map((s) =>
      s._id === scheduleId ? { ...s, is_completed: !s.is_completed } : s
    )
  )

  // Persist to backend
  try {
    await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        scheduleId, 
        is_completed: !schedules.find(s => s._id === scheduleId)?.is_completed 
      })
    })
  } catch (error) {
    // Revert on error
    console.error('Failed to update:', error)
  }
}
```

## Component Props Reference

### SchedulePageClient
```typescript
{
  initialSchedules: ScheduleItem[]
}
```
Manages filters, view switching, and completion state.

### ScheduleCalendar
```typescript
{
  schedules: ScheduleItem[]
  onToggleComplete: (scheduleId: string) => void
}
```
Displays month-based calendar grid.

### ScheduleTaskList
```typescript
{
  schedules: ScheduleItem[]
  onToggleComplete: (scheduleId: string) => void
}
```
Displays date-grouped task list.

### ScheduleTaskCard
```typescript
{
  schedule: ScheduleItem
  onToggleComplete: (scheduleId: string) => void
  compact?: boolean
  isOverdue?: boolean
}
```
Individual task display. `compact=true` for calendar cells.

## Color Classes by Task Type

```typescript
// Breeding - Blue
"bg-blue-50 border-blue-500 dark:bg-blue-950/30 dark:border-blue-700"

// Palpation - Purple
"bg-purple-50 border-purple-500 dark:bg-purple-950/30 dark:border-purple-700"

// Kindling - Green
"bg-green-50 border-green-500 dark:bg-green-950/30 dark:border-green-700"

// Weaning - Orange
"bg-orange-50 border-orange-500 dark:bg-orange-950/30 dark:border-orange-700"

// Vaccination - Red
"bg-red-50 border-red-500 dark:bg-red-950/30 dark:border-red-700"

// Admin - Gray
"bg-gray-50 border-gray-500 dark:bg-gray-950/30 dark:border-gray-700"
```

## Icon Imports (Lucide React)

```typescript
import {
  Calendar,           // Main calendar icon
  ChevronLeft,       // Previous month
  ChevronRight,      // Next month
  List,              // List view toggle
  Heart,             // Breeding
  Users,             // Palpation
  Egg,               // Kindling
  LogOut,            // Weaning
  Pill,              // Vaccination
  Clipboard,         // Admin
  CheckCircle2,      // Completed status
  AlertTriangle,     // Overdue status
  Zap,               // Fallback
} from 'lucide-react'
```

## State Management Pattern

```typescript
// Filter state
const [selectedTypeFilter, setSelectedTypeFilter] = useState<FilterType>('all')
const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')
const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

// Filtered data
const filteredSchedules = useMemo(() => {
  return schedules.filter(s => {
    const typeMatch = selectedTypeFilter === 'all' || s.type === selectedTypeFilter
    const completionMatch = 
      completionFilter === 'all' || 
      (completionFilter === 'pending' ? !s.is_completed : s.is_completed)
    return typeMatch && completionMatch
  })
}, [schedules, selectedTypeFilter, completionFilter])
```

## Summary Calculation

```typescript
const summary = useMemo(() => {
  const now = new Date()
  const upcomingCounts = filteredSchedules.reduce((acc, s) => {
    if (!s.is_completed && s.target_date > now) {
      acc.total++
      if (s.type === 'Kindling') acc.kindlings++
    }
    return acc
  }, { total: 0, kindlings: 0, ... })
  
  return { upcomingCounts, overdue: ..., completed: ... }
}, [filteredSchedules])
```

## Debugging Tips

### Issue: Tasks not filtering
- Check that `selectedTypeFilter` state is updating
- Verify filter logic in `useMemo` for `filteredSchedules`
- Log `filteredSchedules` to browser console

### Issue: View not switching
- Ensure `viewMode` state changes on button click
- Check that both calendar and list components are rendered conditionally

### Issue: Dates not displaying correctly
- Verify `target_date` is a valid Date object
- Check timezone handling if using server dates
- Test date formatting with `toLocaleDateString()`

### Issue: Styling not applying
- Verify Tailwind CSS is in `globals.css`
- Check dark mode class on root element
- Test theme colors from `theme` configuration

## Testing Checklist

- [ ] Calendar renders for current month
- [ ] Month navigation works (prev/next/today)
- [ ] List view groups by date correctly
- [ ] Filtering by type works
- [ ] Completion filter tabs work
- [ ] Checkboxes toggle task completion
- [ ] Overdue tasks show red indicator
- [ ] View switches between calendar and list
- [ ] Mobile responsive (test at 375px, 768px, 1024px)
- [ ] Dark mode displays correctly
- [ ] Summary cards show correct counts
- [ ] Empty state shows when no tasks match filters

## Common Customizations

### Change Calendar View Start Day
In `ScheduleCalendar.tsx`, modify `weekDays` array:
```typescript
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
```

### Add New Task Type
1. Update `ScheduleType` in `/database/types.ts`
2. Add color class in `getTypeStyles()` function
3. Add icon mapping in `getTypeIcon()` function
4. Update filter buttons in `SchedulePageClient`

### Customize Summary Cards
Edit the grid in `SchedulePageClient` (lines ~95-120) to add/remove cards.

### Change Task Card Styling
Modify color classes in `ScheduleTaskCard.tsx`:
- `getTypeStyles()` - Card background and border
- `getTypeColor()` - Badge variant colors

## Performance Notes

- Calendar generation: O(n) where n = days in month (~30)
- Filtering: O(n) where n = total schedules
- Both operations are memoized to prevent unnecessary recalculations
- List grouping creates a Map for O(1) lookup

## Browser DevTools Tips

### Inspect Theme Colors
```javascript
// Check current theme
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```

### Monitor State Changes
```javascript
// Add to component for debugging
console.log('Current filters:', selectedTypeFilter, completionFilter, viewMode)
```

### Test Date Edge Cases
```javascript
new Date().toDateString() // Today
new Date(Date.now() - 86400000).toDateString() // Yesterday
new Date(Date.now() + 86400000).toDateString() // Tomorrow
```
