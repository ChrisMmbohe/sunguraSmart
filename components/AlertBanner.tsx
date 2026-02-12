"use client";

import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
} from "lucide-react";

export type AlertType = "error" | "warning" | "success" | "info";

interface AlertBannerProps {
  type: AlertType;
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const alertConfig = {
  error: {
    icon: AlertTriangle,
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    titleColor: "text-red-900 dark:text-red-100",
    descColor: "text-red-800 dark:text-red-200",
    buttonColor: "hover:bg-red-100 dark:hover:bg-red-900",
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-amber-50 dark:bg-amber-950",
    borderColor: "border-amber-200 dark:border-amber-800",
    titleColor: "text-amber-900 dark:text-amber-100",
    descColor: "text-amber-800 dark:text-amber-200",
    buttonColor: "hover:bg-amber-100 dark:hover:bg-amber-900",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50 dark:bg-green-950",
    borderColor: "border-green-200 dark:border-green-800",
    titleColor: "text-green-900 dark:text-green-100",
    descColor: "text-green-800 dark:text-green-200",
    buttonColor: "hover:bg-green-100 dark:hover:bg-green-900",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    titleColor: "text-blue-900 dark:text-blue-100",
    descColor: "text-blue-800 dark:text-blue-200",
    buttonColor: "hover:bg-blue-100 dark:hover:bg-blue-900",
  },
};

export function AlertBanner({
  type,
  title,
  description,
  dismissible = true,
  onDismiss,
  actionLabel,
  onAction,
  className = "",
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const config = alertConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border ${config.bgColor} ${config.borderColor} p-4 ${className}`}
      role="alert"
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className="shrink-0 pt-0.5">
          <Icon
            className={`h-5 w-5 ${
              type === "error"
                ? "text-red-600 dark:text-red-400"
                : type === "warning"
                  ? "text-amber-600 dark:text-amber-400"
                  : type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-blue-600 dark:text-blue-400"
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${config.titleColor}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm mt-1 ${config.descColor}`}>{description}</p>
          )}

          {/* Action Button */}
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`mt-3 inline-block text-sm font-medium ${config.titleColor} ${config.buttonColor} px-3 py-1 rounded transition-colors`}
              aria-label={actionLabel}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`shrink-0 text-muted-foreground hover:text-foreground transition-colors`}
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export type { AlertBannerProps };
