"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Heart,
  Baby,
  Stethoscope,
  Weight,
  DollarSign,
  ChevronRight,
  Rabbit,
} from "lucide-react";
import Link from "next/link";

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  color?: "default" | "success" | "danger" | "warning" | "info";
}

interface QuickActionsProps {
  actions: QuickActionItem[];
  title?: string;
  layout?: "horizontal" | "vertical" | "grid";
  showDescriptions?: boolean;
  className?: string;
}

const colorClasses = {
  default: "hover:bg-primary/10",
  success: "hover:bg-green-500/10",
  danger: "hover:bg-red-500/10",
  warning: "hover:bg-amber-500/10",
  info: "hover:bg-blue-500/10",
};

export function QuickActions({
  actions,
  title = "Quick Actions",
  layout = "horizontal",
  showDescriptions = false,
  className = "",
}: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(layout === "vertical");

  const layoutClasses = {
    horizontal: "flex gap-2 overflow-x-auto pb-2",
    vertical: "flex flex-col gap-2",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
  };

  return (
    <div className={`rounded-xl border bg-card p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {layout === "horizontal" && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      )}

      <div className={layoutClasses[layout]}>
        {actions.map((action) => {
          const content = (
            <Button
              variant={action.variant || "outline"}
              className={`whitespace-nowrap transition-colors ${colorClasses[action.color || "default"]} ${
                layout === "horizontal" ? "shrink-0" : "w-full justify-start"
              }`}
              onClick={action.onClick}
            >
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0">{action.icon}</span>
                <span className={layout === "grid" ? "hidden md:inline" : ""}>
                  {action.label}
                </span>
                {showDescriptions && layout !== "horizontal" && action.description && (
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                )}
              </div>
            </Button>
          );

          if (action.href) {
            return (
              <Link key={action.id} href={action.href} className="inline-block">
                {content}
              </Link>
            );
          }

          return <div key={action.id}>{content}</div>;
        })}
      </div>

      {showDescriptions && layout !== "horizontal" && (
        <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
          {actions.map((action) => (
            <div key={action.id} className="flex gap-2">
              <span className="text-muted-foreground flex-shrink-0 w-4 text-center">
                {action.icon}
              </span>
              <div>
                <p className="font-medium">{action.label}</p>
                {action.description && (
                  <p className="text-muted-foreground text-xs">{action.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Default quick actions for rabbit farm
export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "record-breeding",
    label: "Record Breeding",
    icon: <Heart className="h-4 w-4" />,
    description: "Log a breeding event",
    href: "/breeding",
    color: "info",
  },
  {
    id: "add-litter",
    label: "Add Litter",
    icon: <Rabbit className="h-4 w-4" />,
    description: "Record a new litter",
    href: "/litters",
    color: "success",
  },
  {
    id: "health-check",
    label: "Health Check",
    icon: <Stethoscope className="h-4 w-4" />,
    description: "Record health information",
    href: "/health",
    color: "warning",
  },
  {
    id: "weigh-rabbit",
    label: "Weigh Rabbit",
    icon: <Weight className="h-4 w-4" />,
    description: "Log rabbit weight",
    href: "/rabbits",
    color: "default",
  },
  {
    id: "record-sale",
    label: "Record Sale",
    icon: <DollarSign className="h-4 w-4" />,
    description: "Log a sale",
    href: "/finances",
    color: "success",
  },
];

export type { QuickActionItem, QuickActionsProps };
