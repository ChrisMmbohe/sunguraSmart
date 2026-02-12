"use client";

import React from "react";
import {
  Baby,
  DollarSign,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string;
  type: "breeding" | "sale" | "health" | "litter" | "alert" | "milestone";
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: "success" | "warning" | "alert" | "info";
  relatedId?: string;
  relatedType?: "rabbit" | "litter" | "breeding";
  metadata?: Record<string, unknown>;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  maxItems?: number;
  onActivityClick?: (activity: ActivityItem) => void;
  className?: string;
}

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "breeding":
      return <Heart className="h-4 w-4" />;
    case "litter":
      return <Baby className="h-4 w-4" />;
    case "sale":
      return <DollarSign className="h-4 w-4" />;
    case "health":
      return <AlertCircle className="h-4 w-4" />;
    case "alert":
      return <AlertCircle className="h-4 w-4" />;
    case "milestone":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (
  status?: ActivityItem["status"]
): string => {
  switch (status) {
    case "success":
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950";
    case "warning":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950";
    case "alert":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
    case "info":
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
    default:
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950";
  }
};

export function RecentActivity({
  activities,
  isLoading = false,
  maxItems = 5,
  onActivityClick,
  className = "",
}: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Latest events from your farm
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: maxItems }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : displayedActivities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          displayedActivities.map((activity) => {
            const colorClass = getActivityColor(activity.status);
            const timestamp =
              typeof activity.timestamp === "string"
                ? new Date(activity.timestamp)
                : activity.timestamp;

            return (
              <div
                key={activity.id}
                className={`flex gap-4 p-3 rounded-lg border border-transparent hover:border-border transition-colors ${
                  onActivityClick ? "cursor-pointer hover:bg-muted/50" : ""
                }`}
                onClick={() => onActivityClick?.(activity)}
                role={onActivityClick ? "button" : undefined}
                tabIndex={onActivityClick ? 0 : undefined}
                onKeyDown={
                  onActivityClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onActivityClick(activity);
                        }
                      }
                    : undefined
                }
              >
                {/* Icon */}
                <div className={`shrink-0 p-2 rounded-lg ${colorClass}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    {onActivityClick && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activities.length > maxItems && (
        <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors">
          View all activity →
        </button>
      )}
    </div>
  );
}

export type { RecentActivityProps };
