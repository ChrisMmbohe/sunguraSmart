'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle2,
  Heart,
  Pill,
  Users,
  LogOut,
  Egg,
  Zap,
  Clipboard,
} from 'lucide-react'
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

interface ScheduleTaskCardProps {
  schedule: ScheduleItem
  onToggleComplete: (scheduleId: string) => void
  compact?: boolean
  isOverdue?: boolean
}

export function ScheduleTaskCard({
  schedule,
  onToggleComplete,
  compact = false,
  isOverdue = false,
}: ScheduleTaskCardProps) {
  const getTypeIcon = (type: ScheduleType) => {
    switch (type) {
      case 'Breeding':
        return <Heart className="h-4 w-4" />
      case 'Palpation':
        return <Users className="h-4 w-4" />
      case 'Kindling':
        return <Egg className="h-4 w-4" />
      case 'Weaning':
        return <LogOut className="h-4 w-4" />
      case 'Vaccination':
        return <Pill className="h-4 w-4" />
      case 'Admin':
        return <Clipboard className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ScheduleType): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'Breeding':
        return 'default'
      case 'Palpation':
        return 'secondary'
      case 'Kindling':
        return 'outline'
      case 'Weaning':
        return 'outline'
      case 'Vaccination':
        return 'destructive'
      case 'Admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getTypeStyles = (type: ScheduleType) => {
    const baseStyles = 'border-l-4 p-3 rounded-lg transition-colors'

    switch (type) {
      case 'Breeding':
        return `${baseStyles} bg-blue-50 border-blue-500 dark:bg-blue-950/30 dark:border-blue-700`
      case 'Palpation':
        return `${baseStyles} bg-purple-50 border-purple-500 dark:bg-purple-950/30 dark:border-purple-700`
      case 'Kindling':
        return `${baseStyles} bg-green-50 border-green-500 dark:bg-green-950/30 dark:border-green-700`
      case 'Weaning':
        return `${baseStyles} bg-orange-50 border-orange-500 dark:bg-orange-950/30 dark:border-orange-700`
      case 'Vaccination':
        return `${baseStyles} bg-red-50 border-red-500 dark:bg-red-950/30 dark:border-red-700`
      case 'Admin':
        return `${baseStyles} bg-gray-50 border-gray-500 dark:bg-gray-950/30 dark:border-gray-700`
      default:
        return `${baseStyles} bg-muted border-muted-foreground`
    }
  }

  if (compact) {
    return (
      <div className={`${getTypeStyles(schedule.type)} text-xs space-y-1`}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            <div className="shrink-0 mt-0.5">{getTypeIcon(schedule.type)}</div>
            <div className="min-w-0">
              <p className="font-medium truncate">{schedule.type}</p>
              <p className="text-xs text-muted-foreground truncate">{schedule.description}</p>
            </div>
          </div>
          <Checkbox
            checked={schedule.is_completed}
            onCheckedChange={() => onToggleComplete(schedule._id)}
            className="shrink-0 mt-0.5"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${getTypeStyles(
        schedule.type
      )} flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${
        schedule.is_completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Checkbox */}
        <Checkbox
          checked={schedule.is_completed}
          onCheckedChange={() => onToggleComplete(schedule._id)}
          className="shrink-0 mt-1"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            {/* Type Badge */}
            <Badge variant={getTypeColor(schedule.type)} className="shrink-0 gap-1">
              {getTypeIcon(schedule.type)}
              <span>{schedule.type}</span>
            </Badge>

            {/* Status Badge */}
            {schedule.is_completed ? (
              <Badge variant="outline" className="shrink-0 gap-1 border-green-300 text-green-700 bg-green-50 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>Completed</span>
              </Badge>
            ) : isOverdue ? (
              <Badge variant="outline" className="shrink-0 gap-1 border-red-300 text-red-700 bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="h-3 w-3" />
                <span>Overdue</span>
              </Badge>
            ) : null}
          </div>

          {/* Description */}
          <p className={`mt-2 text-sm ${schedule.is_completed ? 'line-through' : ''}`}>
            {schedule.description}
          </p>

          {/* Related Rabbits */}
          {schedule.related_rabbit_ids && schedule.related_rabbit_ids.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {schedule.related_rabbit_ids.map((rabbitId) => (
                <Badge key={rabbitId} variant="secondary" className="text-xs">
                  Rabbit #{rabbitId}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="shrink-0 text-right sm:text-left">
        <p className="text-sm font-medium">
          {schedule.target_date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {schedule.target_date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
      </div>
    </div>
  )
}
