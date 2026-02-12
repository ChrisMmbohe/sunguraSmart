'use client'

import { useState, useMemo } from 'react'
import { Calendar, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleCalendar } from '@/components/ScheduleCalendar'
import { ScheduleTaskList } from '@/components/ScheduleTaskList'
import { ScheduleType } from '@/database/types'

interface ScheduleItem {
  _id: string
  user_id: string
  target_date: Date
  type: ScheduleType
  description: string
  is_completed: boolean
  related_rabbit_ids: string[]
  related_entity_id: string | null
  createdAt: Date
  updatedAt: Date
}

interface SchedulePageClientProps {
  initialSchedules: ScheduleItem[]
}

type FilterType = ScheduleType | 'all'
type CompletionFilter = 'all' | 'pending' | 'completed'

export function SchedulePageClient({ initialSchedules }: SchedulePageClientProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules)
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<FilterType>('all')
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // Filter schedules based on selection
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const typeMatch = selectedTypeFilter === 'all' || schedule.type === selectedTypeFilter
      let completionMatch = true

      if (completionFilter === 'pending') {
        completionMatch = !schedule.is_completed
      } else if (completionFilter === 'completed') {
        completionMatch = schedule.is_completed
      }

      return typeMatch && completionMatch
    })
  }, [schedules, selectedTypeFilter, completionFilter])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const now = new Date()
    const upcomingCounts = filteredSchedules.reduce(
      (acc, s) => {
        if (!s.is_completed && s.target_date > now) {
          acc.total++
          if (s.type === 'Kindling') acc.kindlings++
          if (s.type === 'Breeding') acc.breedings++
          if (s.type === 'Vaccination') acc.vaccinations++
        }
        return acc
      },
      { total: 0, kindlings: 0, breedings: 0, vaccinations: 0 }
    )

    const overdue = filteredSchedules.filter(
      (s) => !s.is_completed && s.target_date < now
    ).length

    const completed = filteredSchedules.filter((s) => s.is_completed).length

    return {
      upcomingCounts,
      overdue,
      completed,
    }
  }, [filteredSchedules])

  const handleToggleComplete = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s._id === scheduleId ? { ...s, is_completed: !s.is_completed } : s
      )
    )
  }

  const typeOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'Breeding', label: 'Breeding' },
    { value: 'Palpation', label: 'Palpation' },
    { value: 'Kindling', label: 'Kindling' },
    { value: 'Weaning', label: 'Weaning' },
    { value: 'Vaccination', label: 'Vaccination' },
    { value: 'Admin', label: 'Admin' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage rabbit farming tasks and events
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Upcoming</p>
          <p className="text-2xl font-bold">{summary.upcomingCounts.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending tasks</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{summary.overdue}</p>
          <p className="text-xs text-muted-foreground mt-1">Not completed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Completed</p>
          <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">This period</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Kindlings</p>
          <p className="text-2xl font-bold text-emerald-600">{summary.upcomingCounts.kindlings}</p>
          <p className="text-xs text-muted-foreground mt-1">Expected births</p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedTypeFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTypeFilter(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>

        {/* Completion Filter Buttons */}
        <div className="flex gap-2">
          <Button
            variant={completionFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('all')}
          >
            All
          </Button>
          <Button
            variant={completionFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={completionFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompletionFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Content Views */}
      {viewMode === 'calendar' ? (
        <ScheduleCalendar
          schedules={filteredSchedules}
          onToggleComplete={handleToggleComplete}
        />
      ) : (
        <ScheduleTaskList
          schedules={filteredSchedules}
          onToggleComplete={handleToggleComplete}
        />
      )}

      {/* Empty State */}
      {filteredSchedules.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12">
          <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or create a new task
          </p>
        </div>
      )}
    </div>
  )
}
