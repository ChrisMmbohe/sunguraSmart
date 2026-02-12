"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";
import { formatDistanceToNow, formatDate } from "date-fns";

export interface UpcomingTask {
  id: string;
  title: string;
  description?: string;
  dueDate: Date | string;
  priority: "low" | "medium" | "high" | "critical";
  type: "kindling" | "weaning" | "vaccination" | "health" | "breeding" | "nest" | "other";
  relatedId?: string; // rabbit ID, litter ID, etc.
  href?: string;
  isDismissible?: boolean;
}

interface UpcomingTasksProps {
  tasks: UpcomingTask[];
  isLoading?: boolean;
  maxItems?: number;
  showDate?: boolean;
  onDismiss?: (taskId: string) => void;
  className?: string;
}

const priorityConfig = {
  low: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-100 dark:bg-orange-900",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    badge: "bg-red-100 dark:bg-red-900",
  },
};

const typeIcons = {
  kindling: "🤰",
  weaning: "🍼",
  vaccination: "💉",
  health: "🏥",
  breeding: "❤️",
  nest: "🪶",
  other: "📋",
};

export function UpcomingTasks({
  tasks,
  isLoading = false,
  maxItems = 5,
  showDate = true,
  onDismiss,
  className = "",
}: UpcomingTasksProps) {
  const [dismissedTasks, setDismissedTasks] = useState<Set<string>>(new Set());

  const visibleTasks = tasks
    .filter((task) => !dismissedTasks.has(task.id))
    .slice(0, maxItems);

  const handleDismiss = (taskId: string) => {
    const newDismissed = new Set(dismissedTasks);
    newDismissed.add(taskId);
    setDismissedTasks(newDismissed);
    onDismiss?.(taskId);
  };

  const getDueDateStatus = (dueDate: Date | string) => {
    const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "overdue", label: "Overdue" };
    if (diffDays === 0) return { status: "today", label: "Today" };
    if (diffDays === 1) return { status: "tomorrow", label: "Tomorrow" };
    if (diffDays <= 7) return { status: "soon", label: `In ${diffDays} days` };
    return { status: "later", label: `In ${diffDays} days` };
  };

  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Tasks
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} coming up
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: maxItems }).map((_, i) => (
            <div key={`skeleton-${i}`} className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : visibleTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming tasks</p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const config = priorityConfig[task.priority];
            const dueStatus = getDueDateStatus(task.dueDate);
            const dueDate = typeof task.dueDate === "string" ? new Date(task.dueDate) : task.dueDate;

            const taskContent = (
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${config.bg} ${config.border} hover:shadow-md`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 pt-0.5 text-lg">
                  {typeIcons[task.type as keyof typeof typeIcons]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {task.isDismissible !== false && (
                      <button
                        onClick={() => handleDismiss(task.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss task"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {showDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span
                          className={`font-medium ${
                            dueStatus.status === "overdue"
                              ? "text-red-600 dark:text-red-400"
                              : dueStatus.status === "today"
                                ? "text-amber-600 dark:text-amber-400"
                                : dueStatus.status === "tomorrow"
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {dueStatus.label}
                        </span>
                      </div>
                    )}

                    {/* Priority Badge */}
                    <div
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${config.badge} capitalize`}
                    >
                      {task.priority}
                    </div>

                    {task.href && (
                      <div className="ml-auto flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );

            if (task.href) {
              return (
                <Link key={task.id} href={task.href} className="block">
                  {taskContent}
                </Link>
              );
            }

            return (
              <div key={task.id}>
                {taskContent}
              </div>
            );
          })
        )}
      </div>

      {tasks.length > maxItems && (
        <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors">
          View all tasks →
        </button>
      )}
    </div>
  );
}

export type { UpcomingTask, UpcomingTasksProps };
