"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading?: boolean;
  trend?: {
    value: string;
    positive: boolean;
    percentage?: number;
  };
  subText?: string;
  tooltipContent?: string;
  color?: "primary" | "success" | "danger" | "warning" | "info" | "purple";
  onClick?: () => void;
  href?: string; // Link destination
  className?: string;
  details?: Array<{ label: string; value: string | number }>;
}

const colorClasses = {
  primary: {
    icon: "text-blue-600 dark:text-blue-400",
    value: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 dark:bg-blue-950",
    hover: "hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/50",
  },
  success: {
    icon: "text-green-600 dark:text-green-400",
    value: "text-green-600 dark:text-green-400",
    badge: "bg-green-50 dark:bg-green-950",
    hover: "hover:border-green-500/30 hover:bg-green-50/50 dark:hover:bg-green-950/50",
  },
  danger: {
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 dark:bg-red-950",
    hover: "hover:border-red-500/30 hover:bg-red-50/50 dark:hover:bg-red-950/50",
  },
  warning: {
    icon: "text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-950",
    hover: "hover:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-amber-950/50",
  },
  info: {
    icon: "text-cyan-600 dark:text-cyan-400",
    value: "text-cyan-600 dark:text-cyan-400",
    badge: "bg-cyan-50 dark:bg-cyan-950",
    hover: "hover:border-cyan-500/30 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/50",
  },
  purple: {
    icon: "text-purple-600 dark:text-purple-400",
    value: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-50 dark:bg-purple-950",
    hover: "hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/50",
  },
};

export function StatCard({
  title,
  value,
  icon,
  isLoading = false,
  trend,
  subText,
  tooltipContent,
  color = "primary",
  onClick,
  href,
  className = "",
  details,
}: StatCardProps) {
  const colors = colorClasses[color];
  const [isHovered, setIsHovered] = useState(false);

  const isClickable = onClick || href;

  const cardContent = (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 ${
        isClickable ? `cursor-pointer ${colors.hover}` : ""
      } ${isHovered && isClickable ? "shadow-lg scale-105" : "hover:shadow-md"} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (onClick) onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
        <div className="flex-1">
          <h3 className="tracking-tight text-sm font-medium" title={tooltipContent}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-5 w-5 transition-transform ${isHovered && isClickable ? "scale-110" : ""} ${colors.icon}`}>
            {icon}
          </div>
          {href && isHovered && (
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-32" />
            {subText && <Skeleton className="h-4 w-full" />}
          </div>
        ) : (
          <>
            <div className={`text-3xl font-bold ${colors.value}`}>{value}</div>
            {subText && (
              <p className="text-xs text-muted-foreground mt-2">{subText}</p>
            )}
            
            {details && details.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {details.map((detail, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{detail.label}</span>
                    <span className="font-semibold">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}

            {trend && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  {trend.positive ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      trend.positive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {trend.value}
                  </span>
                </div>
                {trend.percentage !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {trend.percentage}%
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Wrap with Link if href is provided
  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
