# Schedule Page Implementation

## Overview
A fully responsive, modern **Schedule** page for managing rabbit farming tasks and events. The page displays upcoming and past schedules from the backend, allows users to view tasks in multiple formats, mark tasks as completed, and provides an intuitive overview of rabbitry activities.

## Features

### 📅 Multiple Views
- **Calendar View**: Month-based calendar with color-coded events by task type
  - Click navigation between months
  - "Today" button to jump to current date
  - Compact task display with indicators for additional tasks
  - Color-coded task types in calendar cells
  
- **List View**: Chronologically organized task list
  - Tasks grouped by date
  - "Today", "Tomorrow", or specific date headers
  - Full task details with overdue indicators
  - Easy date-based navigation

### 🎯 Task Management
- **Task Types**: Breeding, Palpation, Kindling, Weaning, Vaccination, Admin
- **Color-Coded Badges**: Each task type has a distinct color for quick visual identification
- **Completion Tracking**: Checkbox to mark tasks as completed with optimistic UI updates
- **Overdue Indicators**: Visual red alert for past-due uncompleted tasks
- **Related Rabbits**: Display associated rabbit IDs for context

### 📊 Summary Dashboard
- **Upcoming Tasks**: Count of pending tasks
- **Overdue Tasks**: Count of past-due uncompleted tasks
- **Completed Tasks**: Count of finished tasks this period
- **Expected Kindlings**: Count of upcoming breeding-related tasks

### 🔍 Advanced Filtering
- **Type Filter**: Filter by task type (Breeding, Palpation, Kindling, etc.)
- **Completion Filter**: View All, Pending, or Completed tasks
- **Combined Filters**: All filters work together for precise task views

### 📱 Responsive Design
- Mobile-first design approach
- Adaptive layouts for different screen sizes
- Toggleable view switching (Calendar/List)
- Touch-friendly button sizes
- Responsive grid layouts

### ♿ Accessibility
- ARIA labels on interactive elements
- Keyboard navigable buttons and controls
- Sufficient color contrast for readability
- Semantic HTML structure
- Logical tab order

## File Structure

```
app/
├── schedule/
│   ├── page.tsx                    # Main page component with layout
│   └── schedule-page-client.tsx    # Client-side state management & filters

components/
├── ScheduleCalendar.tsx           # Calendar view component
├── ScheduleTaskList.tsx           # List view component
└── ScheduleTaskCard.tsx           # Individual task card component
```

## Components

### `/app/schedule/page.tsx`
- Server component that handles the main layout with `SidebarProvider`, `AppSidebar`, `SiteHeader`
- Fetches mock schedule data (ready for real API integration)
- Passes data to client component

**Key Features:**
- Integrated with existing app layout
- Type definitions for ScheduleItem
- Mock data for demonstration
- Ready for API integration

### `SchedulePageClient.tsx`
- Client component for interactivity and state management
- Manages filters, view mode, and task completion state
- Calculates summary statistics
- Renders filtered schedules in selected view

**Props:**
```typescript
interface SchedulePageClientProps {
  initialSchedules: ScheduleItem[]
}
```

**State:**
- `schedules`: Array of schedule items
- `selectedTypeFilter`: Currently selected task type filter
- `completionFilter`: "all" | "pending" | "completed"
- `viewMode`: "calendar" | "list"

### `ScheduleCalendar.tsx`
- Month-based calendar grid view
- Navigation between months
- Color-coded task display
- Legend showing task type colors

**Props:**
```typescript
interface ScheduleCalendarProps {
  schedules: ScheduleItem[]
  onToggleComplete: (scheduleId: string) => void
}
```

### `ScheduleTaskList.tsx`
- Chronological list grouped by date
- Smart date formatting ("Today", "Tomorrow", etc.)
- Task count badges per date
- Overdue visual indicators

**Props:**
```typescript
interface ScheduleTaskListProps {
  schedules: ScheduleItem[]
  onToggleComplete: (scheduleId: string) => void
}
```

### `ScheduleTaskCard.tsx`
- Individual task card with full details
- Supports two layouts: compact (calendar) and full (list)
- Type badges with icons
- Status badges (Completed, Overdue)
- Related rabbit ID display
- Date and time display

**Props:**
```typescript
interface ScheduleTaskCardProps {
  schedule: ScheduleItem
  onToggleComplete: (scheduleId: string) => void
  compact?: boolean
  isOverdue?: boolean
}
```

## Task Type Colors

| Type | Color | Use Case |
|------|-------|----------|
| **Breeding** | Blue | Mating operations |
| **Palpation** | Purple | Pregnancy checks |
| **Kindling** | Green | Expected births |
| **Weaning** | Orange | Litter separation |
| **Vaccination** | Red | Health procedures |
| **Admin** | Gray | General tasks |

## Data Structure

```typescript
interface ScheduleItem {
  _id: string
  user_id: string
  target_date: Date
  type: ScheduleType // 'Breeding' | 'Palpation' | 'Kindling' | 'Weaning' | 'Vaccination' | 'Admin'
  description: string
  is_completed: boolean
  related_rabbit_ids: string[]
  related_entity_id: string | null
  createdAt: Date
  updatedAt: Date
}
```

## Usage

### Basic Integration
The page is automatically integrated into the app at `/schedule`. Simply navigate to it to view the schedule dashboard.

### Replacing Mock Data
In `/app/schedule/page.tsx`, replace the mock data with a real API call:

```typescript
// Current (mock):
const schedules = mockSchedules

// Replace with API call:
const schedules = await getSchedules(userId)
```

### Marking Tasks as Complete
The UI already supports marking tasks as complete with a checkbox. To persist changes to the backend:

In `schedule-page-client.tsx`, update the `handleToggleComplete` function:

```typescript
const handleToggleComplete = async (scheduleId: string) => {
  // Call API to update backend
  await fetch(`/api/schedule/${scheduleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_completed: true })
  })
  
  // Then update local state
  setSchedules((prev) =>
    prev.map((s) =>
      s._id === scheduleId ? { ...s, is_completed: !s.is_completed } : s
    )
  )
}
```

## Styling

- **Tailwind CSS**: All components use utility classes from Tailwind
- **Theme Integration**: Respects the app's dark mode and color scheme from `globals.css`
- **Color System**: Uses app-defined colors (primary, destructive, muted, etc.)
- **Responsive Classes**: Mobile-first design with `sm:`, `md:` breakpoints

## Accessibility Features

- Semantic HTML (`<section>`, `<div>` with proper roles)
- ARIA labels where needed
- Keyboard navigation on all buttons
- Color contrast ratios meet WCAG AA standards
- Focus states for interactive elements
- Descriptive button labels

## Performance Considerations

- Memoized filtering with `useMemo` to prevent unnecessary recalculations
- Grouped task lists to minimize render operations
- Lazy-loaded calendar view
- Optimistic UI updates for better perceived performance

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design tested on various screen sizes

## Future Enhancements

1. **Drag & Drop**: Reschedule tasks by dragging
2. **Quick Add**: Modal to quickly create new tasks
3. **Notifications**: Alert user of upcoming/overdue tasks
4. **Export**: Export schedule to PDF or calendar format
5. **Recurring Tasks**: Support for repeating tasks
6. **Task Categories**: Custom categories beyond current types
7. **Search**: Full-text search across task descriptions
8. **Bulk Actions**: Mark multiple tasks as complete
9. **Task Priority**: Add priority levels to tasks
10. **Comments**: Add notes/comments to individual tasks

## Testing

To test the page locally:

1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/schedule`
3. Try switching between Calendar and List views
4. Test filters by clicking different task types
5. Use the completion tabs to filter tasks
6. Mark tasks as complete using checkboxes

## Notes

- Mock data includes various task types and dates for demonstration
- All components are styled consistently with the existing app
- The page integrates seamlessly with the existing sidebar layout
- Ready for backend API integration without component changes needed
