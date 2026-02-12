'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface ScheduleCalendarProps {
  schedules: ScheduleItem[]
  onToggleComplete: (scheduleId: string) => void
}

export function ScheduleCalendar({ schedules, onToggleComplete }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Get calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: (Date | null)[] = []
    let currentDay = new Date(startDate)

    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }, [currentDate])

  // Map schedules to dates
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>()

    schedules.forEach((schedule) => {
      const dateKey = schedule.target_date.toDateString()
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(schedule)
    })

    return map
  }, [schedules])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Calendar Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{monthYear}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) return null

          const dateKey = date.toDateString()
          const daySchedules = schedulesByDate.get(dateKey) || []
          const isOtherMonth = !isCurrentMonth(date)
          const isCurrentDay = isToday(date)

          return (
            <div
              key={index}
              className={`min-h-24 rounded-lg border p-2 ${
                isOtherMonth ? 'bg-muted/30' : 'bg-background'
              } ${isCurrentDay ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <div className={`mb-1 text-xs font-semibold ${isOtherMonth ? 'text-muted-foreground/50' : ''}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {daySchedules.slice(0, 2).map((schedule) => (
                  <ScheduleTaskCard
                    key={schedule._id}
                    schedule={schedule}
                    onToggleComplete={onToggleComplete}
                    compact
                  />
                ))}
                {daySchedules.length > 2 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{daySchedules.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Task Types</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          <TypeLegendItem type="Breeding" color="bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800" />
          <TypeLegendItem type="Palpation" color="bg-purple-100 border-purple-300 dark:bg-purple-950 dark:border-purple-800" />
          <TypeLegendItem type="Kindling" color="bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800" />
          <TypeLegendItem type="Weaning" color="bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800" />
          <TypeLegendItem type="Vaccination" color="bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800" />
          <TypeLegendItem type="Admin" color="bg-gray-100 border-gray-300 dark:bg-gray-950 dark:border-gray-800" />
        </div>
      </div>
    </div>
  )
}

function TypeLegendItem({ type, color }: { type: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded border ${color}`} />
      <span className="text-xs text-muted-foreground">{type}</span>
    </div>
  )
}
