'use client'

import { useMemo } from 'react'
import { ScheduleTaskCard } from '@/components/ScheduleTaskCard'
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

interface ScheduleTaskListProps {
  schedules: ScheduleItem[]
  onToggleComplete: (scheduleId: string) => void
}

export function ScheduleTaskList({ schedules, onToggleComplete }: ScheduleTaskListProps) {
  // Group schedules by date
  const groupedSchedules = useMemo(() => {
    const groups: Map<string, { date: Date; tasks: ScheduleItem[] }> = new Map()

    // Sort schedules by date
    const sorted = [...schedules].sort((a, b) => {
      const completed = a.is_completed === b.is_completed ? 0 : a.is_completed ? 1 : -1
      return completed !== 0 ? completed : a.target_date.getTime() - b.target_date.getTime()
    })

    sorted.forEach((schedule) => {
      const dateKey = schedule.target_date.toDateString()
      if (!groups.has(dateKey)) {
        groups.set(dateKey, { date: new Date(schedule.target_date), tasks: [] })
      }
      groups.get(dateKey)!.tasks.push(schedule)
    })

    return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [schedules])

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const isOverdue = (date: Date, isCompleted: boolean) => {
    return date < new Date() && !isCompleted
  }

  return (
    <div className="space-y-6">
      {groupedSchedules.map((group) => {
        const hasOverdue = group.tasks.some((t) => isOverdue(group.date, t.is_completed))

        return (
          <div key={group.date.toDateString()} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className={`text-lg font-semibold ${hasOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(group.date)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {group.date.toLocaleDateString('en-US', { year: 'numeric' })}
                </p>
              </div>
              <div className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>

            {/* Tasks for this date */}
            <div className="space-y-2">
              {group.tasks.map((schedule) => (
                <ScheduleTaskCard
                  key={schedule._id}
                  schedule={schedule}
                  onToggleComplete={onToggleComplete}
                  isOverdue={isOverdue(schedule.target_date, schedule.is_completed)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
