'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const periods = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'ytd', label: 'Year to Date' },
  { id: 'all', label: 'All Time' },
];

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.id}
          variant={selectedPeriod === period.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange(period.id)}
          className={cn(
            selectedPeriod === period.id
              ? ''
              : 'border-border hover:bg-muted/50'
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
