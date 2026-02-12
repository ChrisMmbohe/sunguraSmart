import { ReactNode } from 'react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  suffix?: string;
  prefix?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

export function KPICard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  suffix,
  prefix,
  variant = 'default',
}: KPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950';
      case 'danger':
        return 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950';
      default:
        return '';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`${getVariantStyles()} overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </CardDescription>
            <div className="flex items-baseline gap-2">
              {prefix && <span className="text-sm font-medium">{prefix}</span>}
              <p className="text-3xl font-bold">
                {typeof value === 'number'
                  ? value.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : value}
              </p>
              {suffix && <span className="text-sm font-medium">{suffix}</span>}
            </div>

            {(description || trendValue !== undefined) && (
              <div className="flex items-center gap-4 mt-3">
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                {trendValue !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                    {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    <span>
                      {trendValue > 0 ? '+' : ''}
                      {trendValue.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          {icon && <div className="ml-4 text-muted-foreground opacity-50">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
